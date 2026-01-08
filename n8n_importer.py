#!/usr/bin/env python3
"""
n8n Auto-Importer - Automatically imports workflows and agents into n8n.

Supports both n8n Cloud and self-hosted instances via REST API.
Handles credential placeholders, workflow activation, and batch imports.

Updated: November 2025
"""

from __future__ import annotations
import json
import logging
import os
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from enum import Enum

import httpx
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


class N8NError(Exception):
    """Custom exception for n8n API errors"""
    pass


class ImportStatus(Enum):
    """Status of workflow import"""
    PENDING = "pending"
    IMPORTING = "importing"
    SUCCESS = "success"
    FAILED = "failed"
    REQUIRES_CREDENTIALS = "requires_credentials"


@dataclass
class CredentialConfig:
    """Configuration for n8n credentials"""
    name: str
    type: str
    data: Dict[str, Any] = field(default_factory=dict)

    # Common credential types
    TYPES = {
        "google": "googleApi",
        "openai": "openAiApi",
        "anthropic": "anthropicApi",
        "slack": "slackOAuth2Api",
        "outlook": "microsoftOutlookOAuth2Api",
        "gmail": "gmailOAuth2",
        "sheets": "googleSheetsOAuth2Api",
        "zoho": "zohoCrmOAuth2Api",
        "notion": "notionApi",
        "teams": "microsoftTeamsOAuth2Api",
    }


@dataclass
class ImportResult:
    """Result of a workflow import operation"""
    workflow_name: str
    status: ImportStatus
    n8n_id: Optional[str] = None
    error: Optional[str] = None
    missing_credentials: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


class N8NClient:
    """Client for n8n REST API"""

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: float = 30.0
    ):
        self.base_url = (base_url or os.getenv("N8N_BASE_URL", "http://localhost:5678")).rstrip("/")
        self.api_key = api_key or os.getenv("N8N_API_KEY")

        if not self.api_key:
            raise N8NError("N8N_API_KEY is required. Set it in environment or pass to constructor.")

        self.client = httpx.Client(
            base_url=self.base_url,
            headers={
                "X-N8N-API-KEY": self.api_key,
                "Content-Type": "application/json",
            },
            timeout=timeout
        )

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict:
        """Make API request with error handling"""
        try:
            response = self.client.request(method, f"/api/v1{endpoint}", **kwargs)
            response.raise_for_status()
            return response.json() if response.content else {}
        except httpx.HTTPStatusError as e:
            error_detail = ""
            try:
                error_detail = e.response.json().get("message", str(e))
            except:
                error_detail = str(e)
            raise N8NError(f"API error: {error_detail}")
        except httpx.RequestError as e:
            raise N8NError(f"Request failed: {e}")

    def test_connection(self) -> bool:
        """Test connection to n8n instance"""
        try:
            self._request("GET", "/workflows")
            return True
        except N8NError:
            return False

    def list_workflows(self, limit: int = 100) -> List[Dict]:
        """List all workflows"""
        result = self._request("GET", f"/workflows?limit={limit}")
        return result.get("data", [])

    def get_workflow(self, workflow_id: str) -> Dict:
        """Get workflow by ID"""
        return self._request("GET", f"/workflows/{workflow_id}")

    def create_workflow(self, workflow_data: Dict) -> Dict:
        """Create a new workflow"""
        # Clean workflow data for import
        clean_data = self._prepare_workflow_for_import(workflow_data)
        return self._request("POST", "/workflows", json=clean_data)

    def update_workflow(self, workflow_id: str, workflow_data: Dict) -> Dict:
        """Update existing workflow"""
        clean_data = self._prepare_workflow_for_import(workflow_data)
        return self._request("PATCH", f"/workflows/{workflow_id}", json=clean_data)

    def delete_workflow(self, workflow_id: str) -> bool:
        """Delete a workflow"""
        self._request("DELETE", f"/workflows/{workflow_id}")
        return True

    def activate_workflow(self, workflow_id: str) -> Dict:
        """Activate a workflow"""
        return self._request("PATCH", f"/workflows/{workflow_id}/activate")

    def deactivate_workflow(self, workflow_id: str) -> Dict:
        """Deactivate a workflow"""
        return self._request("PATCH", f"/workflows/{workflow_id}/deactivate")

    def list_credentials(self) -> List[Dict]:
        """List all credentials"""
        result = self._request("GET", "/credentials")
        return result.get("data", [])

    def create_credential(self, credential_data: Dict) -> Dict:
        """Create a new credential"""
        return self._request("POST", "/credentials", json=credential_data)

    def list_executions(self, workflow_id: Optional[str] = None,
                        limit: int = 20) -> List[Dict]:
        """List workflow executions"""
        endpoint = f"/executions?limit={limit}"
        if workflow_id:
            endpoint += f"&workflowId={workflow_id}"
        result = self._request("GET", endpoint)
        return result.get("data", [])

    def _prepare_workflow_for_import(self, workflow_data: Dict) -> Dict:
        """Prepare workflow data for import by cleaning/transforming"""
        # Remove fields that should be generated by n8n
        fields_to_remove = ["id", "createdAt", "updatedAt", "versionId"]
        clean_data = {k: v for k, v in workflow_data.items() if k not in fields_to_remove}

        # Handle credential references
        if "nodes" in clean_data:
            for node in clean_data["nodes"]:
                if "credentials" in node:
                    # Mark credentials as needing setup
                    for cred_type, cred_ref in node["credentials"].items():
                        if isinstance(cred_ref, dict) and "id" in cred_ref:
                            # Keep the name but remove the ID for fresh import
                            cred_ref.pop("id", None)

        return clean_data

    def close(self):
        """Close the HTTP client"""
        self.client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


class N8NImporter:
    """Handles batch import of workflows and agents into n8n"""

    def __init__(self, client: Optional[N8NClient] = None):
        self.client = client or N8NClient()
        self.results: List[ImportResult] = []

    def import_workflow_file(self, filepath: Path,
                             activate: bool = False,
                             overwrite: bool = False) -> ImportResult:
        """Import a single workflow from JSON file"""

        if not filepath.exists():
            return ImportResult(
                workflow_name=filepath.name,
                status=ImportStatus.FAILED,
                error=f"File not found: {filepath}"
            )

        try:
            workflow_data = json.loads(filepath.read_text())
            return self.import_workflow(workflow_data, activate, overwrite)
        except json.JSONDecodeError as e:
            return ImportResult(
                workflow_name=filepath.name,
                status=ImportStatus.FAILED,
                error=f"Invalid JSON: {e}"
            )

    def import_workflow(self, workflow_data: Dict,
                        activate: bool = False,
                        overwrite: bool = False) -> ImportResult:
        """Import a workflow from dict data"""

        name = workflow_data.get("name", "Unnamed Workflow")
        result = ImportResult(workflow_name=name, status=ImportStatus.IMPORTING)

        try:
            # Check for existing workflow
            existing = self._find_existing_workflow(name)

            if existing and not overwrite:
                result.status = ImportStatus.FAILED
                result.error = f"Workflow '{name}' already exists. Use overwrite=True to replace."
                return result

            # Detect missing credentials
            missing_creds = self._detect_missing_credentials(workflow_data)
            if missing_creds:
                result.missing_credentials = missing_creds
                result.warnings.append(f"Missing credentials: {', '.join(missing_creds)}")

            # Import or update
            if existing and overwrite:
                response = self.client.update_workflow(existing["id"], workflow_data)
                result.n8n_id = existing["id"]
                logger.info(f"Updated workflow: {name} (ID: {result.n8n_id})")
            else:
                response = self.client.create_workflow(workflow_data)
                result.n8n_id = response.get("id")
                logger.info(f"Created workflow: {name} (ID: {result.n8n_id})")

            # Activate if requested and no missing credentials
            if activate and result.n8n_id and not missing_creds:
                try:
                    self.client.activate_workflow(result.n8n_id)
                    logger.info(f"Activated workflow: {name}")
                except N8NError as e:
                    result.warnings.append(f"Could not activate: {e}")

            result.status = ImportStatus.REQUIRES_CREDENTIALS if missing_creds else ImportStatus.SUCCESS

        except N8NError as e:
            result.status = ImportStatus.FAILED
            result.error = str(e)
            logger.error(f"Import failed for {name}: {e}")

        self.results.append(result)
        return result

    def import_directory(self, directory: Path,
                         pattern: str = "*.json",
                         activate: bool = False,
                         overwrite: bool = False) -> List[ImportResult]:
        """Import all workflow files from a directory"""

        if not directory.is_dir():
            raise N8NError(f"Not a directory: {directory}")

        files = list(directory.glob(pattern))
        # Filter out manifest files
        files = [f for f in files if not f.name.startswith("_")]

        logger.info(f"Found {len(files)} workflow files to import")

        results = []
        for filepath in files:
            result = self.import_workflow_file(filepath, activate, overwrite)
            results.append(result)
            time.sleep(0.5)  # Rate limiting

        return results

    def import_from_manifest(self, manifest_path: Path,
                             activate: bool = False,
                             overwrite: bool = False) -> List[ImportResult]:
        """Import workflows listed in a manifest file"""

        manifest = json.loads(manifest_path.read_text())
        directory = manifest_path.parent

        workflows = manifest.get("workflows", []) or manifest.get("templates", [])

        results = []
        for wf in workflows:
            filepath = directory / wf["file"]
            result = self.import_workflow_file(filepath, activate, overwrite)
            results.append(result)
            time.sleep(0.5)

        return results

    def _find_existing_workflow(self, name: str) -> Optional[Dict]:
        """Find existing workflow by name"""
        workflows = self.client.list_workflows()
        for wf in workflows:
            if wf.get("name") == name:
                return wf
        return None

    def _detect_missing_credentials(self, workflow_data: Dict) -> List[str]:
        """Detect credentials referenced but not configured"""
        missing = []
        existing_creds = {c["name"]: c for c in self.client.list_credentials()}

        for node in workflow_data.get("nodes", []):
            for cred_type, cred_ref in node.get("credentials", {}).items():
                cred_name = cred_ref.get("name") if isinstance(cred_ref, dict) else cred_ref
                if cred_name and cred_name not in existing_creds:
                    if cred_name not in missing:
                        missing.append(cred_name)

        return missing

    def create_credential_placeholders(self, credential_types: List[str]) -> Dict[str, str]:
        """Create placeholder credentials for required types"""
        created = {}

        for cred_type in credential_types:
            # Map common names to n8n credential types
            n8n_type = CredentialConfig.TYPES.get(cred_type.lower())
            if not n8n_type:
                # Try to infer type
                n8n_type = f"{cred_type.lower()}Api"

            try:
                name = f"EVA_{cred_type.title()}_Credentials"
                response = self.client.create_credential({
                    "name": name,
                    "type": n8n_type,
                    "data": {}  # Empty placeholder
                })
                created[cred_type] = response.get("id")
                logger.info(f"Created placeholder credential: {name}")
            except N8NError as e:
                logger.warning(f"Could not create credential for {cred_type}: {e}")

        return created

    def generate_import_report(self) -> Dict[str, Any]:
        """Generate summary report of import operations"""

        success = [r for r in self.results if r.status == ImportStatus.SUCCESS]
        failed = [r for r in self.results if r.status == ImportStatus.FAILED]
        needs_creds = [r for r in self.results if r.status == ImportStatus.REQUIRES_CREDENTIALS]

        all_missing_creds = set()
        for r in self.results:
            all_missing_creds.update(r.missing_credentials)

        return {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total": len(self.results),
                "success": len(success),
                "failed": len(failed),
                "requires_credentials": len(needs_creds)
            },
            "successful_imports": [
                {"name": r.workflow_name, "id": r.n8n_id}
                for r in success
            ],
            "failed_imports": [
                {"name": r.workflow_name, "error": r.error}
                for r in failed
            ],
            "missing_credentials": list(all_missing_creds),
            "details": [
                {
                    "name": r.workflow_name,
                    "status": r.status.value,
                    "id": r.n8n_id,
                    "error": r.error,
                    "warnings": r.warnings
                }
                for r in self.results
            ]
        }


class AutoImporter:
    """High-level auto-import that handles the complete flow"""

    def __init__(self, n8n_url: Optional[str] = None, api_key: Optional[str] = None):
        self.client = N8NClient(base_url=n8n_url, api_key=api_key)
        self.importer = N8NImporter(self.client)

    def full_import(
        self,
        workflows_dir: Path,
        agents_dir: Optional[Path] = None,
        activate: bool = False,
        create_credentials: bool = True,
        overwrite: bool = False
    ) -> Dict[str, Any]:
        """Perform full import of workflows and agents"""

        report = {
            "timestamp": datetime.now().isoformat(),
            "workflows": None,
            "agents": None,
            "credentials_created": [],
            "success": False
        }

        try:
            # Test connection
            if not self.client.test_connection():
                raise N8NError("Cannot connect to n8n instance")

            # Import workflows
            if workflows_dir.exists():
                logger.info(f"Importing workflows from: {workflows_dir}")
                self.importer.import_directory(workflows_dir, activate=activate, overwrite=overwrite)

            # Import agents
            if agents_dir and agents_dir.exists():
                logger.info(f"Importing agents from: {agents_dir}")
                self.importer.import_directory(agents_dir, activate=activate, overwrite=overwrite)

            # Create missing credentials if requested
            if create_credentials:
                all_missing = set()
                for result in self.importer.results:
                    all_missing.update(result.missing_credentials)

                if all_missing:
                    created = self.importer.create_credential_placeholders(list(all_missing))
                    report["credentials_created"] = list(created.keys())

            # Generate final report
            import_report = self.importer.generate_import_report()
            report["workflows"] = import_report
            report["success"] = import_report["summary"]["failed"] == 0

        except N8NError as e:
            report["error"] = str(e)
            logger.error(f"Auto-import failed: {e}")

        return report

    def quick_deploy(self, analysis_path: Path, output_dir: Path = None) -> Dict[str, Any]:
        """
        Quick deployment: Generate workflows from analysis and import to n8n.
        One-command solution for going from video analysis to running automations.
        """
        from n8n_workflow_generator import WorkflowGenerator
        from n8n_agent_templates import AgentWorkflowBuilder, AgentTemplate

        output_dir = output_dir or Path("./n8n_deploy")
        output_dir.mkdir(parents=True, exist_ok=True)

        logger.info("Starting quick deployment...")

        # Step 1: Generate workflows from analysis
        logger.info("Generating workflows from analysis...")
        generator = WorkflowGenerator()
        workflows = generator.generate_from_analysis(analysis_path)
        generator.save_all_workflows(workflows, output_dir / "workflows")

        # Step 2: Generate supporting agent templates
        logger.info("Generating agent templates...")
        builder = AgentWorkflowBuilder()
        # Generate key agents that support the discovered automations
        for template in [AgentTemplate.EMAIL_TRIAGE, AgentTemplate.CRM_DATA_SYNC,
                         AgentTemplate.TASK_MANAGER, AgentTemplate.MULTI_AGENT_ORCHESTRATOR]:
            workflow = builder.build_from_template(template)
            workflow.save(output_dir / "agents" / f"{template.value}.json")

        # Step 3: Import everything to n8n
        logger.info("Importing to n8n...")
        report = self.full_import(
            workflows_dir=output_dir / "workflows",
            agents_dir=output_dir / "agents",
            activate=False,  # Don't auto-activate without credential setup
            create_credentials=True,
            overwrite=True
        )

        # Step 4: Generate deployment summary
        summary = {
            "deployment_time": datetime.now().isoformat(),
            "analysis_source": str(analysis_path),
            "output_directory": str(output_dir),
            "workflows_generated": len(workflows),
            "agents_generated": 4,
            "import_report": report,
            "next_steps": [
                "1. Configure credentials in n8n for: " + ", ".join(
                    report.get("credentials_created", ["No credentials needed"])
                ),
                "2. Review and customize generated workflows",
                "3. Test workflows with sample data",
                "4. Activate workflows when ready"
            ]
        }

        # Save summary
        summary_path = output_dir / "deployment_summary.json"
        summary_path.write_text(json.dumps(summary, indent=2))
        logger.info(f"Deployment complete! Summary: {summary_path}")

        return summary


def main():
    """CLI for n8n import operations"""
    import argparse

    parser = argparse.ArgumentParser(description="Import workflows to n8n")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Import command
    import_parser = subparsers.add_parser("import", help="Import workflows")
    import_parser.add_argument("source", type=Path, help="File or directory to import")
    import_parser.add_argument("--activate", action="store_true", help="Activate after import")
    import_parser.add_argument("--overwrite", action="store_true", help="Overwrite existing")
    import_parser.add_argument("--url", type=str, help="n8n base URL")
    import_parser.add_argument("--key", type=str, help="n8n API key")

    # Deploy command
    deploy_parser = subparsers.add_parser("deploy", help="Quick deploy from analysis")
    deploy_parser.add_argument("analysis", type=Path, help="Analysis JSON file")
    deploy_parser.add_argument("-o", "--output", type=Path, default=Path("./n8n_deploy"))
    deploy_parser.add_argument("--url", type=str, help="n8n base URL")
    deploy_parser.add_argument("--key", type=str, help="n8n API key")

    # Test command
    test_parser = subparsers.add_parser("test", help="Test n8n connection")
    test_parser.add_argument("--url", type=str, help="n8n base URL")
    test_parser.add_argument("--key", type=str, help="n8n API key")

    args = parser.parse_args()

    if args.command == "test":
        try:
            client = N8NClient(base_url=args.url, api_key=args.key)
            if client.test_connection():
                print("✓ Successfully connected to n8n")
                workflows = client.list_workflows()
                print(f"  Found {len(workflows)} existing workflows")
            else:
                print("✗ Could not connect to n8n")
        except N8NError as e:
            print(f"✗ Error: {e}")

    elif args.command == "import":
        auto = AutoImporter(n8n_url=args.url, api_key=args.key)
        if args.source.is_file():
            result = auto.importer.import_workflow_file(
                args.source, activate=args.activate, overwrite=args.overwrite
            )
            print(f"Import result: {result.status.value}")
            if result.error:
                print(f"Error: {result.error}")
        else:
            report = auto.full_import(
                workflows_dir=args.source,
                activate=args.activate,
                overwrite=args.overwrite
            )
            print(json.dumps(report, indent=2))

    elif args.command == "deploy":
        auto = AutoImporter(n8n_url=args.url, api_key=args.key)
        summary = auto.quick_deploy(args.analysis, args.output)
        print("\n=== Deployment Complete ===")
        print(f"Workflows: {summary['workflows_generated']}")
        print(f"Agents: {summary['agents_generated']}")
        print(f"\nNext steps:")
        for step in summary["next_steps"]:
            print(f"  {step}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()

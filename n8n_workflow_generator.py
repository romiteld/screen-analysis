#!/usr/bin/env python3
"""
n8n Workflow Generator - Converts automation discoveries to n8n-compatible workflows.
Automatically creates agents and workflows from video analysis results.

Updated: November 2025
"""

from __future__ import annotations
import json
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from enum import Enum


class NodeType(Enum):
    """n8n node types for workflow generation"""
    TRIGGER_WEBHOOK = "n8n-nodes-base.webhook"
    TRIGGER_SCHEDULE = "n8n-nodes-base.scheduleTrigger"
    TRIGGER_MANUAL = "n8n-nodes-base.manualTrigger"

    # AI/LLM Nodes
    AI_AGENT = "@n8n/n8n-nodes-langchain.agent"
    AI_OPENAI = "@n8n/n8n-nodes-langchain.lmChatOpenAi"
    AI_GOOGLE = "@n8n/n8n-nodes-langchain.lmChatGoogleGemini"
    AI_ANTHROPIC = "@n8n/n8n-nodes-langchain.lmChatAnthropic"
    AI_MEMORY = "@n8n/n8n-nodes-langchain.memoryBufferWindow"
    AI_TOOL = "@n8n/n8n-nodes-langchain.toolWorkflow"

    # Integration Nodes
    HTTP_REQUEST = "n8n-nodes-base.httpRequest"
    CODE = "n8n-nodes-base.code"
    SET = "n8n-nodes-base.set"
    IF = "n8n-nodes-base.if"
    SWITCH = "n8n-nodes-base.switch"
    MERGE = "n8n-nodes-base.merge"
    SPLIT = "n8n-nodes-base.splitInBatches"

    # App Integrations
    GMAIL = "n8n-nodes-base.gmail"
    OUTLOOK = "n8n-nodes-base.microsoftOutlook"
    SLACK = "n8n-nodes-base.slack"
    TEAMS = "n8n-nodes-base.microsoftTeams"
    SHEETS = "n8n-nodes-base.googleSheets"
    EXCEL = "n8n-nodes-base.microsoftExcel"
    ZOHO_CRM = "n8n-nodes-base.zohoCrm"
    NOTION = "n8n-nodes-base.notion"


@dataclass
class N8NNode:
    """Represents an n8n workflow node"""
    id: str
    name: str
    type: str
    position: List[int]
    parameters: Dict[str, Any] = field(default_factory=dict)
    credentials: Dict[str, Any] = field(default_factory=dict)
    type_version: float = 1.0

    def to_dict(self) -> Dict:
        node_dict = {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "position": self.position,
            "parameters": self.parameters,
            "typeVersion": self.type_version,
        }
        if self.credentials:
            node_dict["credentials"] = self.credentials
        return node_dict


@dataclass
class N8NConnection:
    """Represents a connection between nodes"""
    source_node: str
    source_output: int
    target_node: str
    target_input: int

    def to_dict(self) -> Dict:
        return {
            "main": [[{
                "node": self.target_node,
                "type": "main",
                "index": self.target_input
            }]]
        }


@dataclass
class N8NWorkflow:
    """Complete n8n workflow structure"""
    name: str
    nodes: List[N8NNode] = field(default_factory=list)
    connections: Dict[str, Any] = field(default_factory=dict)
    settings: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)

    def __post_init__(self):
        self.id = str(uuid.uuid4())
        self.created_at = datetime.now().isoformat()

    def add_node(self, node: N8NNode):
        self.nodes.append(node)

    def connect(self, source_name: str, target_name: str,
                source_output: int = 0, target_input: int = 0):
        if source_name not in self.connections:
            self.connections[source_name] = {"main": [[]]}

        # Ensure we have enough output arrays
        while len(self.connections[source_name]["main"]) <= source_output:
            self.connections[source_name]["main"].append([])

        self.connections[source_name]["main"][source_output].append({
            "node": target_name,
            "type": "main",
            "index": target_input
        })

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "nodes": [n.to_dict() for n in self.nodes],
            "connections": self.connections,
            "settings": self.settings or {
                "executionOrder": "v1",
                "saveManualExecutions": True,
                "callerPolicy": "workflowsFromSameOwner"
            },
            "staticData": None,
            "tags": self.tags,
            "meta": {
                "instanceId": str(uuid.uuid4()),
                "templateCredsSetupCompleted": True
            },
            "pinData": {}
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    def save(self, path: Path):
        path.write_text(self.to_json())


class AutomationCategory(Enum):
    """Categories of automation discovered from video analysis"""
    EMAIL_TRIAGE = "email_triage"
    DATA_ENTRY = "data_entry"
    CRM_UPDATE = "crm_update"
    SCHEDULING = "scheduling"
    DOCUMENT_PROCESSING = "document_processing"
    COMMUNICATION = "communication"
    REPORTING = "reporting"
    FILE_MANAGEMENT = "file_management"
    WEB_SCRAPING = "web_scraping"
    INTEGRATION = "integration"


@dataclass
class DiscoveredAutomation:
    """Represents an automation opportunity discovered from video analysis"""
    id: str
    name: str
    category: AutomationCategory
    description: str
    source_apps: List[str]
    target_apps: List[str]
    complexity: str  # "quick_win", "medium", "complex"
    triggers: List[str]
    actions: List[str]
    frequency: Optional[str] = None
    time_saved_minutes: Optional[int] = None

    @classmethod
    def from_analysis_dict(cls, data: Dict) -> 'DiscoveredAutomation':
        """Create from video analysis output"""
        category_map = {
            "email": AutomationCategory.EMAIL_TRIAGE,
            "data": AutomationCategory.DATA_ENTRY,
            "crm": AutomationCategory.CRM_UPDATE,
            "schedule": AutomationCategory.SCHEDULING,
            "document": AutomationCategory.DOCUMENT_PROCESSING,
            "communication": AutomationCategory.COMMUNICATION,
            "report": AutomationCategory.REPORTING,
            "file": AutomationCategory.FILE_MANAGEMENT,
        }

        # Infer category from keywords
        category = AutomationCategory.INTEGRATION
        idea_lower = data.get("idea", "").lower()
        for key, cat in category_map.items():
            if key in idea_lower:
                category = cat
                break

        return cls(
            id=str(uuid.uuid4()),
            name=data.get("idea", "Unnamed Automation"),
            category=category,
            description=data.get("description", ""),
            source_apps=data.get("source_apps", []),
            target_apps=data.get("target_apps", []),
            complexity=data.get("win", "medium").lower().replace(" ", "_"),
            triggers=data.get("triggers", ["manual"]),
            actions=data.get("actions", []),
            frequency=data.get("frequency"),
            time_saved_minutes=data.get("time_saved")
        )


class WorkflowGenerator:
    """Generates n8n workflows from discovered automations"""

    # Node position grid
    X_START = 250
    Y_START = 300
    X_SPACING = 280
    Y_SPACING = 150

    def __init__(self, default_llm: str = "gemini"):
        self.default_llm = default_llm
        self.node_counter = 0

    def _next_id(self) -> str:
        self.node_counter += 1
        return str(uuid.uuid4())

    def _position(self, col: int, row: int = 0) -> List[int]:
        return [self.X_START + col * self.X_SPACING,
                self.Y_START + row * self.Y_SPACING]

    def generate_trigger_node(self, trigger_type: str, workflow: N8NWorkflow,
                             position: List[int]) -> N8NNode:
        """Generate appropriate trigger node"""
        trigger_map = {
            "webhook": (NodeType.TRIGGER_WEBHOOK, {
                "httpMethod": "POST",
                "path": f"automation-{uuid.uuid4().hex[:8]}",
                "responseMode": "lastNode"
            }),
            "schedule": (NodeType.TRIGGER_SCHEDULE, {
                "rule": {"interval": [{"field": "hours", "hoursInterval": 1}]}
            }),
            "manual": (NodeType.TRIGGER_MANUAL, {}),
            "email": (NodeType.TRIGGER_WEBHOOK, {
                "httpMethod": "POST",
                "path": "email-trigger",
                "responseMode": "lastNode"
            }),
        }

        node_type, params = trigger_map.get(trigger_type, trigger_map["manual"])

        node = N8NNode(
            id=self._next_id(),
            name=f"{trigger_type.title()} Trigger",
            type=node_type.value,
            position=position,
            parameters=params,
            type_version=2.0 if "webhook" in trigger_type else 1.0
        )
        workflow.add_node(node)
        return node

    def generate_ai_agent_node(self, name: str, system_prompt: str,
                               workflow: N8NWorkflow, position: List[int],
                               tools: List[str] = None) -> N8NNode:
        """Generate an AI agent node with LLM and memory"""

        # Main agent node
        agent_node = N8NNode(
            id=self._next_id(),
            name=name,
            type=NodeType.AI_AGENT.value,
            position=position,
            parameters={
                "options": {
                    "systemMessage": system_prompt,
                    "maxIterations": 10,
                    "returnIntermediateSteps": True
                }
            },
            type_version=1.7
        )
        workflow.add_node(agent_node)

        # LLM Model node
        llm_type = {
            "gemini": NodeType.AI_GOOGLE,
            "openai": NodeType.AI_OPENAI,
            "anthropic": NodeType.AI_ANTHROPIC
        }.get(self.default_llm, NodeType.AI_GOOGLE)

        llm_node = N8NNode(
            id=self._next_id(),
            name=f"{name} LLM",
            type=llm_type.value,
            position=[position[0] + 50, position[1] + 180],
            parameters={
                "modelId": {
                    "gemini": "gemini-2.5-flash",
                    "openai": "gpt-4o",
                    "anthropic": "claude-sonnet-4-5-20250929"
                }.get(self.default_llm, "gemini-2.5-flash"),
                "options": {
                    "temperature": 0.7
                }
            },
            type_version=1.0
        )
        workflow.add_node(llm_node)

        # Memory node for conversation context
        memory_node = N8NNode(
            id=self._next_id(),
            name=f"{name} Memory",
            type=NodeType.AI_MEMORY.value,
            position=[position[0] + 200, position[1] + 180],
            parameters={
                "sessionIdType": "customKey",
                "sessionKey": "={{ $json.sessionId || 'default' }}"
            },
            type_version=1.2
        )
        workflow.add_node(memory_node)

        return agent_node

    def generate_integration_node(self, app_name: str, action: str,
                                  workflow: N8NWorkflow, position: List[int]) -> N8NNode:
        """Generate app integration node"""
        app_map = {
            "gmail": (NodeType.GMAIL, {"operation": "send"}),
            "outlook": (NodeType.OUTLOOK, {"operation": "sendEmail"}),
            "slack": (NodeType.SLACK, {"operation": "postMessage"}),
            "teams": (NodeType.TEAMS, {"operation": "sendMessage"}),
            "sheets": (NodeType.SHEETS, {"operation": "appendOrUpdate"}),
            "excel": (NodeType.EXCEL, {"operation": "appendRow"}),
            "zoho": (NodeType.ZOHO_CRM, {"operation": "create"}),
            "notion": (NodeType.NOTION, {"operation": "create"}),
        }

        app_key = app_name.lower().replace(" ", "")
        for key, (node_type, params) in app_map.items():
            if key in app_key:
                node = N8NNode(
                    id=self._next_id(),
                    name=f"{app_name} - {action}",
                    type=node_type.value,
                    position=position,
                    parameters=params,
                    type_version=2.0
                )
                workflow.add_node(node)
                return node

        # Default to HTTP request for unknown apps
        node = N8NNode(
            id=self._next_id(),
            name=f"{app_name} API",
            type=NodeType.HTTP_REQUEST.value,
            position=position,
            parameters={
                "method": "POST",
                "url": f"https://api.{app_name.lower()}.com/v1/{action}",
                "options": {}
            },
            type_version=4.2
        )
        workflow.add_node(node)
        return node

    def generate_code_node(self, name: str, code: str,
                           workflow: N8NWorkflow, position: List[int]) -> N8NNode:
        """Generate a code execution node"""
        node = N8NNode(
            id=self._next_id(),
            name=name,
            type=NodeType.CODE.value,
            position=position,
            parameters={
                "jsCode": code,
                "mode": "runOnceForAllItems"
            },
            type_version=2.0
        )
        workflow.add_node(node)
        return node

    def generate_workflow(self, automation: DiscoveredAutomation) -> N8NWorkflow:
        """Generate complete workflow from discovered automation"""

        workflow = N8NWorkflow(
            name=f"EVA - {automation.name}",
            tags=["eva-generated", automation.category.value, automation.complexity]
        )

        self.node_counter = 0

        # 1. Add trigger
        trigger_type = automation.triggers[0] if automation.triggers else "manual"
        trigger_node = self.generate_trigger_node(trigger_type, workflow, self._position(0))

        # 2. Add AI Agent for decision making
        agent_prompt = self._generate_agent_prompt(automation)
        agent_node = self.generate_ai_agent_node(
            f"{automation.name} Agent",
            agent_prompt,
            workflow,
            self._position(1)
        )
        workflow.connect(trigger_node.name, agent_node.name)

        # 3. Add data transformation
        transform_code = self._generate_transform_code(automation)
        transform_node = self.generate_code_node(
            "Transform Data",
            transform_code,
            workflow,
            self._position(2)
        )
        workflow.connect(agent_node.name, transform_node.name)

        # 4. Add target app integrations
        prev_node = transform_node
        for i, target_app in enumerate(automation.target_apps):
            action = automation.actions[i] if i < len(automation.actions) else "create"
            integration_node = self.generate_integration_node(
                target_app, action, workflow, self._position(3 + i)
            )
            workflow.connect(prev_node.name, integration_node.name)
            prev_node = integration_node

        return workflow

    def _generate_agent_prompt(self, automation: DiscoveredAutomation) -> str:
        """Generate system prompt for the AI agent"""
        return f"""You are an EVA (Executive Virtual Assistant) agent specialized in {automation.category.value}.

Your task: {automation.description or automation.name}

Source Applications: {', '.join(automation.source_apps) if automation.source_apps else 'Various'}
Target Applications: {', '.join(automation.target_apps) if automation.target_apps else 'Various'}

Guidelines:
1. Analyze incoming data carefully before taking action
2. Validate all data before processing
3. Log all decisions for audit purposes
4. Handle errors gracefully with clear messages
5. Maintain consistency across all operations

Actions to perform: {', '.join(automation.actions) if automation.actions else 'Process and route data'}

Always respond with structured JSON containing:
- decision: Your decision on how to process
- confidence: Confidence level (high/medium/low)
- actions: List of actions to take
- reasoning: Brief explanation of your decision
"""

    def _generate_transform_code(self, automation: DiscoveredAutomation) -> str:
        """Generate JavaScript transformation code"""
        return f"""// Auto-generated transformation for: {automation.name}
// Category: {automation.category.value}

const items = $input.all();
const results = [];

for (const item of items) {{
  const data = item.json;

  // Parse AI agent response
  const agentResponse = typeof data === 'string' ? JSON.parse(data) : data;

  // Transform data for target systems
  const transformed = {{
    timestamp: new Date().toISOString(),
    source: '{automation.source_apps[0] if automation.source_apps else "input"}',
    category: '{automation.category.value}',
    decision: agentResponse.decision || 'default',
    confidence: agentResponse.confidence || 'medium',
    payload: agentResponse.actions || [data],
    metadata: {{
      automationId: '{automation.id}',
      complexity: '{automation.complexity}',
      generatedBy: 'EVA-WorkflowGenerator'
    }}
  }};

  results.push({{ json: transformed }});
}}

return results;
"""

    def generate_from_analysis(self, analysis_path: Path) -> List[N8NWorkflow]:
        """Generate workflows from video analysis JSON output"""

        analysis_data = json.loads(analysis_path.read_text())
        workflows = []

        for segment in analysis_data:
            analysis = segment.get("analysis", "")

            # Try to parse structured automation data
            try:
                # Handle both string and dict analysis
                if isinstance(analysis, str):
                    # Try to extract JSON from the analysis text
                    import re
                    json_match = re.search(r'\{[\s\S]*\}', analysis)
                    if json_match:
                        analysis = json.loads(json_match.group())

                if isinstance(analysis, dict):
                    automations = analysis.get("automation", [])
                    for auto_data in automations:
                        automation = DiscoveredAutomation.from_analysis_dict(auto_data)
                        workflow = self.generate_workflow(automation)
                        workflows.append(workflow)

            except (json.JSONDecodeError, KeyError) as e:
                # If parsing fails, create a generic workflow
                automation = DiscoveredAutomation(
                    id=str(uuid.uuid4()),
                    name=f"Automation from Segment {segment.get('segment', 'unknown')}",
                    category=AutomationCategory.INTEGRATION,
                    description=str(analysis)[:500],
                    source_apps=[],
                    target_apps=[],
                    complexity="medium",
                    triggers=["manual"],
                    actions=["process"]
                )
                workflows.append(self.generate_workflow(automation))

        return workflows

    def save_all_workflows(self, workflows: List[N8NWorkflow], output_dir: Path):
        """Save all workflows to directory"""
        output_dir.mkdir(parents=True, exist_ok=True)

        manifest = {
            "generated_at": datetime.now().isoformat(),
            "workflow_count": len(workflows),
            "workflows": []
        }

        for workflow in workflows:
            filename = f"{workflow.name.replace(' ', '_').lower()}.json"
            filepath = output_dir / filename
            workflow.save(filepath)

            manifest["workflows"].append({
                "id": workflow.id,
                "name": workflow.name,
                "file": filename,
                "tags": workflow.tags
            })

        # Save manifest
        manifest_path = output_dir / "_manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2))

        return manifest


# CLI Interface
def main():
    import argparse

    parser = argparse.ArgumentParser(description="Generate n8n workflows from analysis")
    parser.add_argument("input", type=Path, help="Path to analysis JSON file")
    parser.add_argument("-o", "--output", type=Path, default=Path("./n8n_workflows"),
                        help="Output directory for generated workflows")
    parser.add_argument("--llm", choices=["gemini", "openai", "anthropic"],
                        default="gemini", help="Default LLM for AI agents")
    args = parser.parse_args()

    generator = WorkflowGenerator(default_llm=args.llm)
    workflows = generator.generate_from_analysis(args.input)
    manifest = generator.save_all_workflows(workflows, args.output)

    print(f"Generated {manifest['workflow_count']} workflows")
    print(f"Output directory: {args.output}")
    print(f"Manifest: {args.output}/_manifest.json")


if __name__ == "__main__":
    main()

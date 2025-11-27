#!/usr/bin/env python3
"""
n8n AI Agent Templates - Pre-built agent configurations for common EVA tasks.

These templates are designed to be imported into n8n and customized for specific
executive workflows discovered through video analysis.

Updated: November 2025
"""

from __future__ import annotations
import json
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from enum import Enum

from n8n_workflow_generator import (
    N8NWorkflow, N8NNode, NodeType, WorkflowGenerator
)


class AgentTemplate(Enum):
    """Pre-built agent templates"""
    EMAIL_TRIAGE = "email_triage"
    CRM_DATA_SYNC = "crm_data_sync"
    CALENDAR_ASSISTANT = "calendar_assistant"
    DOCUMENT_PROCESSOR = "document_processor"
    COMMUNICATION_ROUTER = "communication_router"
    REPORT_GENERATOR = "report_generator"
    LEAD_QUALIFIER = "lead_qualifier"
    TASK_MANAGER = "task_manager"
    VOICE_ASSISTANT = "voice_assistant"
    MULTI_AGENT_ORCHESTRATOR = "multi_agent_orchestrator"


@dataclass
class AgentConfig:
    """Configuration for an agent template"""
    name: str
    description: str
    template: AgentTemplate
    system_prompt: str
    tools: List[str] = field(default_factory=list)
    integrations: List[str] = field(default_factory=list)
    triggers: List[str] = field(default_factory=list)
    llm_model: str = "gemini-2.5-flash"
    temperature: float = 0.7
    max_iterations: int = 10


class AgentTemplateLibrary:
    """Library of pre-built agent templates for EVA"""

    TEMPLATES: Dict[AgentTemplate, AgentConfig] = {
        AgentTemplate.EMAIL_TRIAGE: AgentConfig(
            name="Email Triage Agent",
            description="Automatically categorizes, prioritizes, and routes incoming emails",
            template=AgentTemplate.EMAIL_TRIAGE,
            system_prompt="""You are an Email Triage Agent for an executive assistant system.

Your responsibilities:
1. CATEGORIZE emails into: Urgent, Important, Informational, Spam, Personal
2. PRIORITIZE based on sender importance, subject keywords, and content urgency
3. EXTRACT key action items and deadlines mentioned in emails
4. DRAFT brief summaries for executive review
5. SUGGEST appropriate responses or routing

For each email, provide:
- category: The email category
- priority: 1-5 (1 being highest priority)
- summary: 2-3 sentence summary
- action_items: List of required actions
- suggested_response: Draft response if needed
- routing: Who should handle this (executive, delegate, archive)

Always consider:
- VIP senders should be prioritized
- Time-sensitive content requires immediate flagging
- Legal or financial matters need special attention
- Personal matters should be marked for private review
""",
            tools=["email_search", "calendar_check", "contact_lookup"],
            integrations=["Microsoft Outlook", "Gmail", "Slack"],
            triggers=["email_received", "schedule"],
            llm_model="gemini-2.5-flash",
            temperature=0.3
        ),

        AgentTemplate.CRM_DATA_SYNC: AgentConfig(
            name="CRM Data Sync Agent",
            description="Synchronizes data between CRM systems and other tools",
            template=AgentTemplate.CRM_DATA_SYNC,
            system_prompt="""You are a CRM Data Synchronization Agent.

Your responsibilities:
1. MONITOR data changes across connected systems
2. VALIDATE data integrity before syncing
3. TRANSFORM data formats between systems
4. RESOLVE conflicts using defined rules
5. LOG all sync operations for audit

Data handling rules:
- Always preserve the most recent timestamp
- Merge duplicate contacts intelligently
- Flag data quality issues for human review
- Never delete data without confirmation
- Maintain referential integrity

For each sync operation, provide:
- source_system: Where data originated
- target_system: Where data is being synced
- records_processed: Count of records
- conflicts_found: Any data conflicts
- resolution: How conflicts were resolved
- next_sync: Recommended next sync time
""",
            tools=["crm_api", "data_validator", "conflict_resolver"],
            integrations=["Zoho CRM", "Salesforce", "HubSpot", "Google Sheets"],
            triggers=["webhook", "schedule"],
            llm_model="gemini-2.5-flash",
            temperature=0.2
        ),

        AgentTemplate.CALENDAR_ASSISTANT: AgentConfig(
            name="Calendar Assistant Agent",
            description="Manages scheduling, meeting prep, and calendar optimization",
            template=AgentTemplate.CALENDAR_ASSISTANT,
            system_prompt="""You are a Calendar Management Agent for executive scheduling.

Your responsibilities:
1. OPTIMIZE calendar for productivity (focus blocks, meeting batching)
2. SCHEDULE meetings considering time zones and preferences
3. PREPARE meeting briefs with relevant context
4. DETECT scheduling conflicts and propose resolutions
5. SEND reminders and follow-ups

Scheduling preferences:
- Protect morning focus time (8-10 AM)
- Batch similar meetings together
- Leave buffer time between meetings
- Prioritize internal meetings on specific days
- External meetings with travel time considerations

For each scheduling action, provide:
- action_type: schedule/reschedule/cancel/prepare
- participants: List of attendees
- time_slot: Proposed or final time
- conflicts: Any detected conflicts
- preparation: Meeting prep materials needed
- follow_up: Post-meeting actions required
""",
            tools=["calendar_api", "contact_lookup", "document_search"],
            integrations=["Google Calendar", "Microsoft Outlook", "Zoom", "Teams"],
            triggers=["email_received", "calendar_event", "manual"],
            llm_model="gemini-2.5-flash",
            temperature=0.5
        ),

        AgentTemplate.DOCUMENT_PROCESSOR: AgentConfig(
            name="Document Processor Agent",
            description="Processes, analyzes, and routes documents intelligently",
            template=AgentTemplate.DOCUMENT_PROCESSOR,
            system_prompt="""You are a Document Processing Agent.

Your responsibilities:
1. CLASSIFY documents by type and department
2. EXTRACT key data points and metadata
3. VALIDATE document completeness
4. ROUTE to appropriate workflows or personnel
5. ARCHIVE with proper indexing

Document types handled:
- Contracts and legal documents
- Financial reports and invoices
- HR documents and policies
- Technical specifications
- Marketing materials

For each document, provide:
- document_type: Classification
- extracted_data: Key data points as JSON
- validation_status: complete/incomplete/issues
- routing: Where to send next
- tags: Indexing keywords
- expiration: If applicable
""",
            tools=["ocr_processor", "pdf_parser", "data_extractor"],
            integrations=["Google Drive", "Dropbox", "SharePoint", "Notion"],
            triggers=["file_upload", "email_attachment", "webhook"],
            llm_model="gemini-2.5-pro",
            temperature=0.3
        ),

        AgentTemplate.COMMUNICATION_ROUTER: AgentConfig(
            name="Communication Router Agent",
            description="Routes communications to the right channels and people",
            template=AgentTemplate.COMMUNICATION_ROUTER,
            system_prompt="""You are a Communication Routing Agent.

Your responsibilities:
1. ANALYZE incoming communications across all channels
2. DETERMINE the best response channel
3. IDENTIFY the right person to handle each communication
4. ESCALATE urgent matters appropriately
5. TRACK response times and follow-ups

Channel priorities:
1. Direct calls for urgent matters
2. Teams/Slack for quick internal comms
3. Email for formal/external communications
4. SMS for critical time-sensitive alerts

For each communication, provide:
- source_channel: Where it came from
- target_channel: Best response channel
- assignee: Who should respond
- urgency: low/medium/high/critical
- context: Relevant background info
- sla: Expected response time
""",
            tools=["channel_api", "contact_directory", "escalation_rules"],
            integrations=["Slack", "Teams", "Email", "SMS", "Voice"],
            triggers=["message_received", "call_completed"],
            llm_model="gemini-2.5-flash",
            temperature=0.4
        ),

        AgentTemplate.REPORT_GENERATOR: AgentConfig(
            name="Report Generator Agent",
            description="Automatically generates reports from various data sources",
            template=AgentTemplate.REPORT_GENERATOR,
            system_prompt="""You are a Report Generation Agent.

Your responsibilities:
1. AGGREGATE data from multiple sources
2. ANALYZE trends and patterns
3. GENERATE formatted reports
4. HIGHLIGHT key insights and anomalies
5. DISTRIBUTE to appropriate stakeholders

Report types:
- Daily executive summary
- Weekly performance metrics
- Monthly financial overview
- Quarterly business review
- Ad-hoc analysis requests

For each report, provide:
- report_type: Type of report
- data_sources: Where data came from
- key_metrics: Important numbers
- insights: Key findings
- recommendations: Suggested actions
- distribution: Who receives this
""",
            tools=["data_aggregator", "chart_generator", "pdf_creator"],
            integrations=["Google Sheets", "Excel", "Tableau", "Power BI"],
            triggers=["schedule", "manual", "data_threshold"],
            llm_model="gemini-2.5-pro",
            temperature=0.5
        ),

        AgentTemplate.LEAD_QUALIFIER: AgentConfig(
            name="Lead Qualifier Agent",
            description="Qualifies and scores leads for sales team",
            template=AgentTemplate.LEAD_QUALIFIER,
            system_prompt="""You are a Lead Qualification Agent.

Your responsibilities:
1. SCORE leads based on defined criteria
2. ENRICH lead data from available sources
3. ROUTE qualified leads to appropriate sales reps
4. NURTURE unqualified leads with automated sequences
5. TRACK conversion metrics

Scoring criteria:
- Company size and industry fit
- Budget authority indicators
- Timeline urgency signals
- Need alignment with offerings
- Engagement level (website, emails)

For each lead, provide:
- lead_score: 0-100 score
- qualification_status: hot/warm/cold/disqualified
- enrichment_data: Additional info found
- recommended_action: Next step
- assigned_rep: Sales rep assignment
- nurture_sequence: If applicable
""",
            tools=["crm_api", "enrichment_api", "email_sequences"],
            integrations=["Zoho CRM", "Salesforce", "LinkedIn", "Clearbit"],
            triggers=["new_lead", "lead_activity", "score_threshold"],
            llm_model="gemini-2.5-flash",
            temperature=0.4
        ),

        AgentTemplate.TASK_MANAGER: AgentConfig(
            name="Task Manager Agent",
            description="Creates, assigns, and tracks tasks from various inputs",
            template=AgentTemplate.TASK_MANAGER,
            system_prompt="""You are a Task Management Agent.

Your responsibilities:
1. EXTRACT tasks from emails, meetings, and conversations
2. ASSIGN tasks with appropriate priority and deadlines
3. TRACK progress and send reminders
4. ESCALATE overdue or blocked tasks
5. REPORT on team productivity

Task attributes:
- Clear, actionable title
- Detailed description
- Assignee and reviewer
- Due date and priority
- Dependencies and blockers
- Success criteria

For each task, provide:
- task_title: Clear action item
- description: Full context
- assignee: Who is responsible
- due_date: Deadline
- priority: P1/P2/P3/P4
- dependencies: Blocking tasks
- project: Related project
""",
            tools=["task_api", "notification_sender", "calendar_blocker"],
            integrations=["Asana", "Monday", "Jira", "Notion", "Todoist"],
            triggers=["email_received", "meeting_ended", "manual"],
            llm_model="gemini-2.5-flash",
            temperature=0.5
        ),

        AgentTemplate.VOICE_ASSISTANT: AgentConfig(
            name="Voice Assistant Agent",
            description="Handles voice interactions and call management",
            template=AgentTemplate.VOICE_ASSISTANT,
            system_prompt="""You are a Voice Assistant Agent for call handling.

Your responsibilities:
1. TRANSCRIBE and analyze voice calls
2. EXTRACT action items from conversations
3. ROUTE calls to appropriate personnel
4. HANDLE initial inquiries autonomously
5. PROVIDE call summaries and follow-ups

Voice interaction rules:
- Be professional and concise
- Confirm understanding before acting
- Offer to transfer for complex issues
- Log all interactions accurately
- Follow up on promised actions

For each call, provide:
- call_summary: Brief overview
- caller_intent: What they needed
- action_items: Tasks created
- resolution: How it was handled
- follow_up: Next steps needed
- sentiment: Caller satisfaction
""",
            tools=["speech_to_text", "text_to_speech", "call_routing"],
            integrations=["Twilio", "JustCall", "Zoom Phone", "Teams Voice"],
            triggers=["incoming_call", "voicemail", "scheduled_call"],
            llm_model="gemini-2.5-flash-native-audio-preview-09-2025",
            temperature=0.6
        ),

        AgentTemplate.MULTI_AGENT_ORCHESTRATOR: AgentConfig(
            name="Multi-Agent Orchestrator",
            description="Coordinates multiple agents for complex workflows",
            template=AgentTemplate.MULTI_AGENT_ORCHESTRATOR,
            system_prompt="""You are a Multi-Agent Orchestrator.

Your responsibilities:
1. ANALYZE incoming requests for complexity
2. DECOMPOSE complex tasks into sub-tasks
3. DELEGATE to specialized agents
4. COORDINATE parallel and sequential execution
5. AGGREGATE results and handle exceptions

Available specialist agents:
- Email Triage Agent
- Calendar Assistant Agent
- CRM Data Sync Agent
- Document Processor Agent
- Communication Router Agent
- Report Generator Agent

For each orchestration, provide:
- request_analysis: Understanding of the task
- decomposition: Breakdown of sub-tasks
- delegation_plan: Which agents handle what
- execution_order: Parallel vs sequential
- aggregation_logic: How to combine results
- fallback_plan: Error handling approach
""",
            tools=["agent_invoker", "workflow_executor", "state_manager"],
            integrations=["All connected integrations"],
            triggers=["complex_request", "escalation", "manual"],
            llm_model="gemini-2.5-pro",
            temperature=0.5,
            max_iterations=20
        ),
    }

    @classmethod
    def get_template(cls, template: AgentTemplate) -> AgentConfig:
        """Get agent configuration for a template"""
        return cls.TEMPLATES[template]

    @classmethod
    def list_templates(cls) -> List[Dict[str, str]]:
        """List all available templates"""
        return [
            {
                "id": t.value,
                "name": cls.TEMPLATES[t].name,
                "description": cls.TEMPLATES[t].description
            }
            for t in AgentTemplate
        ]


class AgentWorkflowBuilder:
    """Builds complete n8n workflows from agent templates"""

    def __init__(self, generator: Optional[WorkflowGenerator] = None):
        self.generator = generator or WorkflowGenerator()

    def build_from_template(self, template: AgentTemplate,
                            customizations: Dict[str, Any] = None) -> N8NWorkflow:
        """Build a complete workflow from an agent template"""

        config = AgentTemplateLibrary.get_template(template)

        # Apply customizations
        if customizations:
            if "name" in customizations:
                config.name = customizations["name"]
            if "system_prompt" in customizations:
                config.system_prompt = customizations["system_prompt"]
            if "llm_model" in customizations:
                config.llm_model = customizations["llm_model"]
            if "integrations" in customizations:
                config.integrations = customizations["integrations"]

        workflow = N8NWorkflow(
            name=f"EVA - {config.name}",
            tags=["eva-agent", template.value, "auto-generated"]
        )

        # Build workflow nodes
        nodes = []
        pos_col = 0

        # 1. Add trigger node
        trigger_type = config.triggers[0] if config.triggers else "manual"
        trigger_node = N8NNode(
            id=str(uuid.uuid4()),
            name=f"{trigger_type.title()} Trigger",
            type=self._get_trigger_type(trigger_type),
            position=[250, 300],
            parameters=self._get_trigger_params(trigger_type),
            type_version=2.0
        )
        workflow.add_node(trigger_node)
        pos_col += 1

        # 2. Add input processor
        input_processor = N8NNode(
            id=str(uuid.uuid4()),
            name="Process Input",
            type=NodeType.CODE.value,
            position=[250 + 280 * pos_col, 300],
            parameters={
                "jsCode": self._generate_input_processor(config),
                "mode": "runOnceForAllItems"
            },
            type_version=2.0
        )
        workflow.add_node(input_processor)
        workflow.connect(trigger_node.name, input_processor.name)
        pos_col += 1

        # 3. Add main AI agent
        agent_node = N8NNode(
            id=str(uuid.uuid4()),
            name=config.name,
            type=NodeType.AI_AGENT.value,
            position=[250 + 280 * pos_col, 300],
            parameters={
                "options": {
                    "systemMessage": config.system_prompt,
                    "maxIterations": config.max_iterations,
                    "returnIntermediateSteps": True
                }
            },
            type_version=1.7
        )
        workflow.add_node(agent_node)
        workflow.connect(input_processor.name, agent_node.name)

        # Add LLM node connected to agent
        llm_node = N8NNode(
            id=str(uuid.uuid4()),
            name=f"{config.name} LLM",
            type=self._get_llm_node_type(config.llm_model),
            position=[250 + 280 * pos_col + 50, 500],
            parameters={
                "modelId": config.llm_model,
                "options": {"temperature": config.temperature}
            },
            type_version=1.0
        )
        workflow.add_node(llm_node)

        # Add memory node
        memory_node = N8NNode(
            id=str(uuid.uuid4()),
            name=f"{config.name} Memory",
            type=NodeType.AI_MEMORY.value,
            position=[250 + 280 * pos_col + 200, 500],
            parameters={
                "sessionIdType": "customKey",
                "sessionKey": "={{ $json.sessionId || $execution.id }}"
            },
            type_version=1.2
        )
        workflow.add_node(memory_node)
        pos_col += 1

        # 4. Add output processor
        output_processor = N8NNode(
            id=str(uuid.uuid4()),
            name="Process Output",
            type=NodeType.CODE.value,
            position=[250 + 280 * pos_col, 300],
            parameters={
                "jsCode": self._generate_output_processor(config),
                "mode": "runOnceForAllItems"
            },
            type_version=2.0
        )
        workflow.add_node(output_processor)
        workflow.connect(agent_node.name, output_processor.name)
        pos_col += 1

        # 5. Add integration nodes based on configured integrations
        for i, integration in enumerate(config.integrations[:3]):  # Limit to 3
            int_node = N8NNode(
                id=str(uuid.uuid4()),
                name=f"Send to {integration}",
                type=self._get_integration_type(integration),
                position=[250 + 280 * pos_col, 300 + 150 * i],
                parameters=self._get_integration_params(integration),
                type_version=2.0
            )
            workflow.add_node(int_node)
            workflow.connect(output_processor.name, int_node.name, source_output=i)

        return workflow

    def _get_trigger_type(self, trigger: str) -> str:
        """Map trigger name to n8n node type"""
        triggers = {
            "webhook": NodeType.TRIGGER_WEBHOOK.value,
            "email_received": NodeType.TRIGGER_WEBHOOK.value,
            "schedule": NodeType.TRIGGER_SCHEDULE.value,
            "manual": NodeType.TRIGGER_MANUAL.value,
            "calendar_event": NodeType.TRIGGER_WEBHOOK.value,
            "file_upload": NodeType.TRIGGER_WEBHOOK.value,
            "message_received": NodeType.TRIGGER_WEBHOOK.value,
        }
        return triggers.get(trigger, NodeType.TRIGGER_MANUAL.value)

    def _get_trigger_params(self, trigger: str) -> Dict:
        """Get parameters for trigger node"""
        if trigger in ["webhook", "email_received", "file_upload", "message_received"]:
            return {
                "httpMethod": "POST",
                "path": f"eva-{trigger}-{uuid.uuid4().hex[:8]}",
                "responseMode": "lastNode"
            }
        elif trigger == "schedule":
            return {
                "rule": {
                    "interval": [{"field": "hours", "hoursInterval": 1}]
                }
            }
        return {}

    def _get_llm_node_type(self, model: str) -> str:
        """Get LLM node type based on model"""
        if "gemini" in model:
            return NodeType.AI_GOOGLE.value
        elif "gpt" in model or "openai" in model:
            return NodeType.AI_OPENAI.value
        elif "claude" in model or "anthropic" in model:
            return NodeType.AI_ANTHROPIC.value
        return NodeType.AI_GOOGLE.value

    def _get_integration_type(self, integration: str) -> str:
        """Map integration name to n8n node type"""
        integrations = {
            "gmail": NodeType.GMAIL.value,
            "outlook": NodeType.OUTLOOK.value,
            "microsoft outlook": NodeType.OUTLOOK.value,
            "slack": NodeType.SLACK.value,
            "teams": NodeType.TEAMS.value,
            "microsoft teams": NodeType.TEAMS.value,
            "google sheets": NodeType.SHEETS.value,
            "excel": NodeType.EXCEL.value,
            "microsoft excel": NodeType.EXCEL.value,
            "zoho": NodeType.ZOHO_CRM.value,
            "zoho crm": NodeType.ZOHO_CRM.value,
            "notion": NodeType.NOTION.value,
        }
        return integrations.get(integration.lower(), NodeType.HTTP_REQUEST.value)

    def _get_integration_params(self, integration: str) -> Dict:
        """Get default parameters for integration"""
        return {"operation": "create"}

    def _generate_input_processor(self, config: AgentConfig) -> str:
        """Generate input processing code"""
        return f"""// Input processor for {config.name}
const items = $input.all();
const results = [];

for (const item of items) {{
  const data = item.json;

  // Prepare input for AI agent
  const processed = {{
    input: data,
    timestamp: new Date().toISOString(),
    sessionId: data.sessionId || $execution.id,
    context: {{
      agentType: '{config.template.value}',
      tools: {json.dumps(config.tools)},
      integrations: {json.dumps(config.integrations)}
    }}
  }};

  results.push({{ json: processed }});
}}

return results;
"""

    def _generate_output_processor(self, config: AgentConfig) -> str:
        """Generate output processing code"""
        return f"""// Output processor for {config.name}
const items = $input.all();
const results = [];

for (const item of items) {{
  const agentOutput = item.json;

  // Parse and structure agent response
  let parsed;
  try {{
    parsed = typeof agentOutput.output === 'string'
      ? JSON.parse(agentOutput.output)
      : agentOutput.output || agentOutput;
  }} catch (e) {{
    parsed = {{ raw: agentOutput.output || agentOutput }};
  }}

  const structured = {{
    agentType: '{config.template.value}',
    agentName: '{config.name}',
    timestamp: new Date().toISOString(),
    executionId: $execution.id,
    response: parsed,
    metadata: {{
      model: '{config.llm_model}',
      temperature: {config.temperature}
    }}
  }};

  results.push({{ json: structured }});
}}

return results;
"""

    def build_all_templates(self, output_dir: Path) -> Dict[str, Any]:
        """Build all agent templates and save to directory"""
        output_dir.mkdir(parents=True, exist_ok=True)

        manifest = {
            "generated_at": datetime.now().isoformat(),
            "templates": []
        }

        for template in AgentTemplate:
            workflow = self.build_from_template(template)
            filename = f"eva_{template.value}_agent.json"
            filepath = output_dir / filename
            workflow.save(filepath)

            manifest["templates"].append({
                "id": template.value,
                "name": workflow.name,
                "file": filename,
                "config": AgentTemplateLibrary.get_template(template).__dict__
            })

        manifest_path = output_dir / "_agent_manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2, default=str))

        return manifest


def main():
    """CLI for generating agent templates"""
    import argparse

    parser = argparse.ArgumentParser(description="Generate n8n agent templates")
    parser.add_argument("-o", "--output", type=Path, default=Path("./n8n_agents"),
                        help="Output directory")
    parser.add_argument("--template", type=str, choices=[t.value for t in AgentTemplate],
                        help="Generate specific template only")
    parser.add_argument("--list", action="store_true", help="List available templates")
    args = parser.parse_args()

    if args.list:
        print("\nAvailable Agent Templates:\n")
        for t in AgentTemplateLibrary.list_templates():
            print(f"  {t['id']:25} - {t['description']}")
        return

    builder = AgentWorkflowBuilder()

    if args.template:
        template = AgentTemplate(args.template)
        workflow = builder.build_from_template(template)
        args.output.mkdir(parents=True, exist_ok=True)
        filepath = args.output / f"eva_{args.template}_agent.json"
        workflow.save(filepath)
        print(f"Generated: {filepath}")
    else:
        manifest = builder.build_all_templates(args.output)
        print(f"Generated {len(manifest['templates'])} agent templates")
        print(f"Output directory: {args.output}")


if __name__ == "__main__":
    main()

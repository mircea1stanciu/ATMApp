"""
Backend Development AI Agent for UnifiedWork
Specialized agent for Backend Developers community
"""

import os
from typing import List, Dict
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import HumanMessage, AIMessage


class BackendAgent:
    """AI Agent specialized for Backend Developers"""
    
    def __init__(self):
        """Initialize the Backend Agent"""
        self.conversation_history: List[Dict[str, str]] = []
        self.community = "backend"
        self.agent_name = "BackendGPT"
        
        # Initialize LLM
        self.llm = self._initialize_llm()
        self.tools = []  # Add backend-specific tools here
        
        # Create a simple agent without tools for now
        self.agent_executor = self._create_agent()
    
    def _initialize_llm(self):
        """Initialize Language Model"""
        if os.getenv("OPENAI_API_KEY"):
            return ChatOpenAI(
                model=os.getenv("DEFAULT_MODEL", "gpt-4o-mini"),
                temperature=0.7,
                max_tokens=4096
            )
        elif os.getenv("ANTHROPIC_API_KEY"):
            return ChatAnthropic(
                model=os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"),
                temperature=0.7,
                max_tokens=4096
            )
        else:
            raise ValueError("No API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY")
    
    def _create_agent(self):
        """Create the Backend specialized agent"""
        
        system_prompt = """You are BackendGPT, an expert Backend Developer and Architect specializing in:

- API Development (REST, GraphQL, gRPC)
- Database Design (SQL, NoSQL, migrations)
- Server Architecture (microservices, monoliths)
- Security (authentication, authorization, encryption)
- Performance Optimization (caching, indexing, scaling)
- DevOps Integration (CI/CD, containerization)
- Framework Expertise (FastAPI, Django, Express, Spring Boot)
- Cloud Platforms (AWS, GCP, Azure)

Your role is to help with:
1. API design and implementation
2. Database schema design and optimization
3. System architecture decisions
4. Security best practices
5. Performance tuning and scaling
6. Code review and refactoring
7. Troubleshooting backend issues

Guidelines:
- Write clean, maintainable, and secure code
- Follow REST and API design principles
- Emphasize performance and scalability
- Include proper error handling
- Focus on production-ready solutions
- Explain architectural decisions
- Consider security implications"""

        # Simple prompt template without tools
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
        ])
        
        # Return a simple chain instead of agent
        return prompt | self.llm
    
    def process_query(self, query: str) -> str:
        """Process user query and return response"""
        try:
            # Prepare chat history
            chat_history = []
            for msg in self.conversation_history[-10:]:
                if msg["role"] == "user":
                    chat_history.append(HumanMessage(content=msg["content"]))
                else:
                    chat_history.append(AIMessage(content=msg["content"]))
            
            # Invoke the chain
            response = self.agent_executor.invoke({
                "input": query,
                "chat_history": chat_history
            })
            
            output = response.content if hasattr(response, 'content') else str(response)
            
            # Update conversation history
            self.conversation_history.append({"role": "user", "content": query})
            self.conversation_history.append({"role": "assistant", "content": output})
            
            return output
            
        except Exception as e:
            error_msg = f"I encountered an error: {str(e)}\n\nPlease try rephrasing your question or provide more details."
            return error_msg
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []
    
    def get_history(self) -> List[Dict[str, str]]:
        """Get conversation history"""
        return self.conversation_history
    
    def get_capabilities(self) -> List[Dict[str, str]]:
        """Get agent capabilities for UI display"""
        return [
            {
                "icon": "🔧",
                "title": "API Design",
                "description": "REST, GraphQL, and gRPC APIs"
            },
            {
                "icon": "🗄️",
                "title": "Database Design", 
                "description": "Schema design and optimization"
            },
            {
                "icon": "🔒",
                "title": "Security",
                "description": "Authentication and authorization"
            },
            {
                "icon": "⚡",
                "title": "Performance",
                "description": "Optimization and scaling"
            },
            {
                "icon": "🐛",
                "title": "Debug Issues",
                "description": "Server-side troubleshooting"
            },
            {
                "icon": "📊",
                "title": "Monitoring",
                "description": "Logging and metrics"
            }
        ]

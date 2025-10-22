"""Design AI Agent""" 
import os
from typing import List, Dict
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import HumanMessage, AIMessage

class DesignAgent:
    def __init__(self):
        self.conversation_history: List[Dict[str, str]] = []
        self.community = "design"
        self.agent_name = "DesignGPT"
        self.llm = self._initialize_llm()
        self.agent_executor = self._create_agent()
    
    def _initialize_llm(self):
        if os.getenv("OPENAI_API_KEY"):
            return ChatOpenAI(model=os.getenv("DEFAULT_MODEL", "gpt-4o-mini"), temperature=0.7, max_tokens=4096)
        elif os.getenv("ANTHROPIC_API_KEY"):
            return ChatAnthropic(model=os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"), temperature=0.7, max_tokens=4096)
        else:
            raise ValueError("No API key found")
    
    def _create_agent(self):
        system_prompt = """You are DesignGPT, an expert UI/UX Designer specializing in:
- Design Systems and Component Libraries
- User Experience Research and Testing
- Accessibility (WCAG compliance)
- Design Tools (Figma, Sketch, Adobe XD)
- Prototyping and Wireframing
- User Journey Mapping
- Information Architecture
- Visual Design and Typography"""

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
        ])
        return prompt | self.llm
    
    def process_query(self, query: str) -> str:
        try:
            chat_history = []
            for msg in self.conversation_history[-10:]:
                if msg["role"] == "user":
                    chat_history.append(HumanMessage(content=msg["content"]))
                else:
                    chat_history.append(AIMessage(content=msg["content"]))
            
            response = self.agent_executor.invoke({"input": query, "chat_history": chat_history})
            output = response.content if hasattr(response, 'content') else str(response)
            
            self.conversation_history.append({"role": "user", "content": query})
            self.conversation_history.append({"role": "assistant", "content": output})
            return output
        except Exception as e:
            return f"Error: {str(e)}"
    
    def clear_history(self):
        self.conversation_history = []
    
    def get_history(self) -> List[Dict[str, str]]:
        return self.conversation_history
    
    def get_capabilities(self) -> List[Dict[str, str]]:
        return [
            {"icon": "🎨", "title": "Design Systems", "description": "Consistent UI patterns"},
            {"icon": "♿", "title": "Accessibility", "description": "WCAG compliance"},
            {"icon": "🔄", "title": "User Flows", "description": "Journey mapping"},
            {"icon": "🎭", "title": "Prototyping", "description": "Interactive mockups"},
            {"icon": "📊", "title": "User Research", "description": "Data-driven design"},
            {"icon": "🎯", "title": "Usability", "description": "User testing insights"}
        ]

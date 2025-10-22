'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import Header from '../../../components/Header'
import EnhancedChatInterface from '../../../components/EnhancedChatInterface'

const communityData = {
  qa: {
    name: 'QA Engineers',
    icon: '🎯',
    agent: 'QualityGPT',
    color: 'bg-blue-500',
    capabilities: [
      { icon: '📝', title: 'Generate Tests', description: 'Create Playwright test code' },
      { icon: '🔍', title: 'Review Code', description: 'Analyze and improve tests' },
      { icon: '📚', title: 'Explain Concepts', description: 'Learn QA automation' },
      { icon: '🎯', title: 'Create Scenarios', description: 'Generate test scenarios' },
      { icon: '🐛', title: 'Debug Issues', description: 'Fix test failures' },
      { icon: '✅', title: 'Best Practices', description: 'Industry standards' }
    ],
    examples: [
      {
        category: '📝 Test Generation',
        queries: [
          'Generate a Playwright test for login functionality',
          'Create a test for e-commerce checkout flow',
          'Write tests for API endpoint validation',
          'Generate unit tests for user registration'
        ]
      },
      {
        category: '🔍 Code Review',
        queries: [
          'Review my Playwright test code for improvements',
          'Check my test structure for best practices',
          'Analyze test coverage and suggest improvements',
          'Optimize my test performance'
        ]
      },
      {
        category: '📚 Learning',
        queries: [
          'What is Page Object Model?',
          'Explain test automation pyramid',
          'How to implement data-driven testing?',
          'Best practices for test maintenance'
        ]
      },
      {
        category: '🐛 Debugging',
        queries: [
          'Why is my test failing intermittently?',
          'How to debug element not found errors?',
          'Fix timeout issues in my tests',
          'Resolve test environment setup problems'
        ]
      }
    ],
    placeholder: 'Ask me anything about QA automation...'
  },
  backend: {
    name: 'Backend Developers',
    icon: '🔧',
    agent: 'BackendGPT',
    color: 'bg-green-500',
    capabilities: [
      { icon: '🔧', title: 'API Design', description: 'RESTful and GraphQL APIs' },
      { icon: '🗄️', title: 'Database Design', description: 'Schema and optimization' },
      { icon: '🔒', title: 'Security', description: 'Authentication and authorization' },
      { icon: '⚡', title: 'Performance', description: 'Optimization and scaling' },
      { icon: '🐛', title: 'Debug Issues', description: 'Server-side troubleshooting' },
      { icon: '📊', title: 'Monitoring', description: 'Logging and metrics' }
    ],
    examples: [
      {
        category: '🔧 API Development',
        queries: [
          'Create a REST API for user management',
          'Design GraphQL schema for e-commerce',
          'Implement CRUD operations with Node.js',
          'Build microservices architecture'
        ]
      },
      {
        category: '🗄️ Database',
        queries: [
          'Design database schema for social media app',
          'Optimize slow PostgreSQL queries',
          'Implement database migrations',
          'Set up Redis caching strategy'
        ]
      },
      {
        category: '🔒 Security',
        queries: [
          'Implement JWT authentication',
          'Set up OAuth2 with Google',
          'Secure API endpoints with rate limiting',
          'Implement role-based access control'
        ]
      }
    ],
    placeholder: 'Ask me about backend development, APIs, databases...'
  },
  frontend: {
    name: 'Frontend Developers',
    icon: '🎨',
    agent: 'FrontendGPT',
    color: 'bg-purple-500',
    capabilities: [
      { icon: '⚛️', title: 'React/Vue/Angular', description: 'Modern frameworks' },
      { icon: '📱', title: 'Mobile Development', description: 'React Native, Flutter' },
      { icon: '🎨', title: 'UI Components', description: 'Reusable components' },
      { icon: '📐', title: 'Responsive Design', description: 'Mobile-first approach' },
      { icon: '⚡', title: 'Performance', description: 'Bundle optimization' },
      { icon: '🧪', title: 'Testing', description: 'Unit and integration tests' }
    ],
    examples: [
      {
        category: '⚛️ React Development',
        queries: [
          'Create a React component for user profile',
          'Implement state management with Redux',
          'Build a custom hook for API calls',
          'Set up React Router for navigation'
        ]
      },
      {
        category: '📱 Mobile Development',
        queries: [
          'Build a React Native navigation system',
          'Create responsive mobile layouts',
          'Implement native device features',
          'Optimize mobile app performance'
        ]
      },
      {
        category: '🎨 Styling & Design',
        queries: [
          'Create a responsive navbar with Tailwind',
          'Design a modern card component',
          'Implement dark mode toggle',
          'Build accessible form components'
        ]
      }
    ],
    placeholder: 'Ask me about frontend development, React, mobile apps...'
  },
  design: {
    name: 'UI/UX Designers',
    icon: '✨',
    agent: 'DesignGPT',
    color: 'bg-pink-500',
    capabilities: [
      { icon: '🎨', title: 'Design Systems', description: 'Consistent UI patterns' },
      { icon: '♿', title: 'Accessibility', description: 'WCAG compliance' },
      { icon: '🔄', title: 'User Flows', description: 'Journey mapping' },
      { icon: '🎭', title: 'Prototyping', description: 'Interactive mockups' },
      { icon: '📊', title: 'User Research', description: 'Data-driven design' },
      { icon: '🎯', title: 'Usability', description: 'User testing insights' }
    ],
    examples: [
      {
        category: '🎨 Design Systems',
        queries: [
          'Create a comprehensive button component library',
          'Design consistent color palette',
          'Build responsive grid system',
          'Establish typography scale'
        ]
      },
      {
        category: '♿ Accessibility',
        queries: [
          'Make my form components accessible',
          'Implement keyboard navigation',
          'Design for screen readers',
          'Ensure color contrast compliance'
        ]
      },
      {
        category: '🔄 User Experience',
        queries: [
          'Design effective onboarding flow',
          'Create user journey maps',
          'Optimize checkout process UX',
          'Design error handling patterns'
        ]
      }
    ],
    placeholder: 'Ask me about design systems, UX research, accessibility...'
  },
  product: {
    name: 'Product Managers',
    icon: '📊',
    agent: 'ProductGPT',
    color: 'bg-orange-500',
    capabilities: [
      { icon: '📋', title: 'Requirements', description: 'Feature specifications' },
      { icon: '📖', title: 'User Stories', description: 'Agile methodology' },
      { icon: '🗺️', title: 'Roadmaps', description: 'Strategic planning' },
      { icon: '📊', title: 'Analytics', description: 'Data-driven decisions' },
      { icon: '👥', title: 'Stakeholder Management', description: 'Communication' },
      { icon: '🎯', title: 'Market Research', description: 'Competitive analysis' }
    ],
    examples: [
      {
        category: '📋 Requirements',
        queries: [
          'Write detailed requirements for chat feature',
          'Create acceptance criteria for user login',
          'Define API specifications for mobile app',
          'Document integration requirements'
        ]
      },
      {
        category: '📖 User Stories',
        queries: [
          'Create user stories for e-commerce checkout',
          'Write epics for user management system',
          'Define story acceptance criteria',
          'Prioritize product backlog items'
        ]
      },
      {
        category: '🗺️ Strategy',
        queries: [
          'Plan Q1 product roadmap',
          'Define go-to-market strategy',
          'Create feature prioritization matrix',
          'Analyze competitor positioning'
        ]
      }
    ],
    placeholder: 'Ask me about product strategy, requirements, user stories...'
  },
  devops: {
    name: 'DevOps Engineers',
    icon: '🔐',
    agent: 'OpsGPT',
    color: 'bg-red-500',
    capabilities: [
      { icon: '🔄', title: 'CI/CD', description: 'Automated pipelines' },
      { icon: '☁️', title: 'Infrastructure', description: 'Cloud architecture' },
      { icon: '📊', title: 'Monitoring', description: 'System observability' },
      { icon: '🐳', title: 'Containerization', description: 'Docker and Kubernetes' },
      { icon: '🔒', title: 'Security', description: 'Infrastructure security' },
      { icon: '📈', title: 'Scaling', description: 'Performance optimization' }
    ],
    examples: [
      {
        category: '🔄 CI/CD',
        queries: [
          'Set up GitHub Actions pipeline for Node.js',
          'Create automated testing workflow',
          'Implement blue-green deployment',
          'Configure multi-environment deployments'
        ]
      },
      {
        category: '☁️ Infrastructure',
        queries: [
          'Deploy application to AWS with Terraform',
          'Set up Kubernetes cluster',
          'Configure load balancer and auto-scaling',
          'Implement disaster recovery strategy'
        ]
      },
      {
        category: '🐳 Containerization',
        queries: [
          'Containerize Node.js application with Docker',
          'Create Docker Compose for development',
          'Optimize Docker image size',
          'Set up Kubernetes deployment manifests'
        ]
      }
    ],
    placeholder: 'Ask me about CI/CD, infrastructure, monitoring, security...'
  },
  docs: {
    name: 'Technical Writers',
    icon: '📝',
    agent: 'DocsGPT',
    color: 'bg-indigo-500',
    capabilities: [
      { icon: '📚', title: 'Documentation', description: 'Technical guides' },
      { icon: '📖', title: 'API Docs', description: 'Developer resources' },
      { icon: '🎓', title: 'Tutorials', description: 'Step-by-step guides' },
      { icon: '📝', title: 'Content Strategy', description: 'Information architecture' },
      { icon: '🔍', title: 'Content Audit', description: 'Quality assurance' },
      { icon: '👥', title: 'User Guides', description: 'End-user documentation' }
    ],
    examples: [
      {
        category: '📚 Documentation',
        queries: [
          'Write comprehensive API documentation',
          'Create developer getting started guide',
          'Document software architecture',
          'Write troubleshooting guides'
        ]
      },
      {
        category: '🎓 Tutorials',
        queries: [
          'Create step-by-step React tutorial',
          'Write database setup guide',
          'Document deployment process',
          'Create video script for feature demo'
        ]
      },
      {
        category: '📝 Content Strategy',
        queries: [
          'Improve technical writing clarity',
          'Structure information architecture',
          'Create content style guide',
          'Plan documentation roadmap'
        ]
      }
    ],
    placeholder: 'Ask me about technical writing, documentation, tutorials...'
  }
}

export default function CommunityPage() {
  const params = useParams()
  const communityId = params.id as string
  
  const community = communityData[communityId as keyof typeof communityData]
  
  if (!community) {
    notFound()
  }

  return (
    <div className="h-screen flex flex-col">
      <Header 
        currentCommunity={communityId}
        onClear={() => {/* Handled by EnhancedChatInterface */}}
        onShowExamples={() => {/* Handled by EnhancedChatInterface */}}
      />
      
      <EnhancedChatInterface
        communityId={communityId}
        communityName={community.name}
        communityIcon={community.icon}
        communityColor={community.color}
        capabilities={community.capabilities}
        examples={community.examples}
      />
    </div>
  )
}

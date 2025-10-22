'use client'

import { useState } from 'react'
import Header from '../../../components/Header'
import Sidebar from '../../../components/Sidebar'
import ChatInterface from '../../../components/ChatInterface'

const qaCapabilities = [
  {
    icon: '📝',
    title: 'Generate Tests',
    description: 'Create Playwright test code'
  },
  {
    icon: '🔍',
    title: 'Review Code',
    description: 'Analyze and improve tests'
  },
  {
    icon: '📚',
    title: 'Explain Concepts',
    description: 'Learn QA automation'
  },
  {
    icon: '🎯',
    title: 'Create Scenarios',
    description: 'Generate test scenarios'
  },
  {
    icon: '🐛',
    title: 'Debug Issues',
    description: 'Fix test failures'
  },
  {
    icon: '✅',
    title: 'Best Practices',
    description: 'Industry standards'
  }
]

const quickTips = [
  {
    title: '📝 Test Generation',
    example: '"Generate a Playwright test for login"'
  },
  {
    title: '📚 Learning',
    example: '"What is Page Object Model?"'
  },
  {
    title: '🔍 Code Review',
    example: '"Review my test code"'
  },
  {
    title: '🐛 Debugging',
    example: '"Why is my test failing?"'
  }
]

export default function QACommunityPage() {
  const [showExamples, setShowExamples] = useState(false)

  const welcomeContent = (
    <div className="text-center py-8">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        👋 Welcome to QA Engineers Community!
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
        I'm QualityGPT, your AI assistant for test automation and quality assurance. 
        I'm here to help you learn and master test automation. Ask me anything about:
      </p>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
        {quickTips.map((tip, index) => (
          <div
            key={index}
            className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-left hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
              {tip.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              {tip.example}
            </p>
          </div>
        ))}
      </div>
      
      <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">
        Type a message below to get started! 🚀
      </p>
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-surface-900">
      <Header 
        currentCommunity="qa"
        onClear={() => {/* Handle clear */}}
        onShowExamples={() => setShowExamples(true)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          capabilities={qaCapabilities}
          communityName="QA Engineers"
        />
        
        <ChatInterface
          agentName="QualityGPT"
          communityIcon="🎯"
          communityColor="bg-blue-500"
          placeholder="Ask me anything about QA automation..."
          welcomeContent={welcomeContent}
        />
      </div>
      
      {/* Examples Modal - Similar to your original */}
      {showExamples && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowExamples(false)}>
          <div className="bg-white dark:bg-surface-800 rounded-lg max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  💡 Example Queries
                </h2>
                <button
                  onClick={() => setShowExamples(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Test Generation</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 dark:bg-surface-900 rounded border cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900">
                      "Generate a Playwright test for user login"
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-surface-900 rounded border cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900">
                      "Create a test for form validation"
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Learning</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 dark:bg-surface-900 rounded border cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900">
                      "What is Page Object Model?"
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-surface-900 rounded border cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900">
                      "Explain test pyramid concept"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

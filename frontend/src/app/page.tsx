'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'

const communities = [
  {
    id: 'qa',
    name: 'QA Engineers',
    icon: '🎯',
    agent: 'QualityGPT',
    description: 'Test automation, scenarios, bug analysis',
    color: 'bg-blue-500',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600'
  },
  {
    id: 'backend',
    name: 'Backend Developers',
    icon: '🔧',
    agent: 'BackendGPT',
    description: 'API design, database optimization, security',
    color: 'bg-green-500',
    borderColor: 'border-green-200',
    textColor: 'text-green-600'
  },
  {
    id: 'frontend',
    name: 'Frontend Developers',
    icon: '🎨',
    agent: 'FrontendGPT',
    description: 'React/Vue/Angular, mobile apps, responsive design',
    color: 'bg-purple-500',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-600'
  },
  {
    id: 'design',
    name: 'UI/UX Designers',
    icon: '✨',
    agent: 'DesignGPT',
    description: 'Design systems, accessibility, user flows',
    color: 'bg-pink-500',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-600'
  },
  {
    id: 'product',
    name: 'Product Managers',
    icon: '📊',
    agent: 'ProductGPT',
    description: 'Requirements, user stories, roadmaps',
    color: 'bg-orange-500',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-600'
  },
  {
    id: 'devops',
    name: 'DevOps Engineers',
    icon: '🔐',
    agent: 'OpsGPT',
    description: 'CI/CD, infrastructure, monitoring',
    color: 'bg-red-500',
    borderColor: 'border-red-200',
    textColor: 'text-red-600'
  },
  {
    id: 'docs',
    name: 'Technical Writers',
    icon: '📝',
    agent: 'DocsGPT',
    description: 'Documentation, guides, tutorials',
    color: 'bg-indigo-500',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-600'
  }
]

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<string>('hero')
  const [animationDirection, setAnimationDirection] = useState<'down' | 'up'>('down')
  const sections = ['hero', 'communities', 'about']

  const handleSectionChange = (section: string, direction?: 'down' | 'up') => {
    const currentIndex = sections.indexOf(activeSection)
    const newIndex = sections.indexOf(section)
    
    if (direction) {
      setAnimationDirection(direction)
    } else {
      setAnimationDirection(newIndex > currentIndex ? 'down' : 'up')
    }
    
    setActiveSection(section)
  }

  // Scroll-based navigation
  useEffect(() => {
    // Disable body scrolling for carousel effect
    document.body.style.overflow = 'hidden'
    
    let isScrolling = false
    let scrollTimeout: NodeJS.Timeout

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      if (isScrolling) return
      
      const currentIndex = sections.indexOf(activeSection)
      let newIndex = currentIndex

      if (e.deltaY > 0) {
        // Scroll down - next section
        newIndex = Math.min(currentIndex + 1, sections.length - 1)
        if (newIndex !== currentIndex) {
          setAnimationDirection('down')
        }
      } else {
        // Scroll up - previous section
        newIndex = Math.max(currentIndex - 1, 0)
        if (newIndex !== currentIndex) {
          setAnimationDirection('up')
        }
      }

      if (newIndex !== currentIndex) {
        isScrolling = true
        setActiveSection(sections[newIndex])
        
        // Reset scrolling flag after animation
        clearTimeout(scrollTimeout)
        scrollTimeout = setTimeout(() => {
          isScrolling = false
        }, 600) // Match animation duration
      }
    }

    // Add wheel event listener
    window.addEventListener('wheel', handleWheel, { passive: false })

    // Touch/swipe support for mobile
    let touchStartY = 0
    let touchEndY = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.changedTouches[0].screenY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling) return
      
      touchEndY = e.changedTouches[0].screenY
      const deltaY = touchStartY - touchEndY
      const minSwipeDistance = 50

      if (Math.abs(deltaY) > minSwipeDistance) {
        const currentIndex = sections.indexOf(activeSection)
        let newIndex = currentIndex

        if (deltaY > 0) {
          // Swipe up - next section
          newIndex = Math.min(currentIndex + 1, sections.length - 1)
          if (newIndex !== currentIndex) {
            setAnimationDirection('down')
          }
        } else {
          // Swipe down - previous section
          newIndex = Math.max(currentIndex - 1, 0)
          if (newIndex !== currentIndex) {
            setAnimationDirection('up')
          }
        }

        if (newIndex !== currentIndex) {
          isScrolling = true
          setActiveSection(sections[newIndex])
          
          clearTimeout(scrollTimeout)
          scrollTimeout = setTimeout(() => {
            isScrolling = false
          }, 600)
        }
      }
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isScrolling) return
      
      const currentIndex = sections.indexOf(activeSection)
      let newIndex = currentIndex

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        newIndex = Math.min(currentIndex + 1, sections.length - 1)
        if (newIndex !== currentIndex) {
          setAnimationDirection('down')
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        newIndex = Math.max(currentIndex - 1, 0)
        if (newIndex !== currentIndex) {
          setAnimationDirection('up')
        }
      }

      if (newIndex !== currentIndex) {
        isScrolling = true
        setActiveSection(sections[newIndex])
        
        clearTimeout(scrollTimeout)
        scrollTimeout = setTimeout(() => {
          isScrolling = false
        }, 600)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      // Re-enable body scrolling when component unmounts
      document.body.style.overflow = 'auto'
      
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(scrollTimeout)
    }
  }, [activeSection, sections])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      {/* Enhanced Navigation Header */}
      <Header 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      {/* Carousel Content */}
      <main className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
        {/* Section Indicator */}
        <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-40 hidden md:flex flex-col space-y-3">
          {sections.map((section, index) => (
            <button
              key={section}
              onClick={() => handleSectionChange(section)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                activeSection === section
                  ? 'bg-blue-600 scale-125'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              title={section === 'hero' ? 'Home' : section === 'communities' ? 'Explore Communities' : 'Learn More'}
            />
          ))}
        </div>

        {/* Scroll Hints */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 text-center">
          <div className="flex flex-col items-center space-y-2 text-gray-500 dark:text-gray-400">
            {activeSection !== sections[sections.length - 1] && (
              <div className="animate-bounce">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m0 0l7-7" />
                </svg>
              </div>
            )}
            <span className="text-xs font-medium">
              {activeSection === 'hero' && 'Scroll down to explore'}
              {activeSection === 'communities' && 'Scroll up/down to navigate'}
              {activeSection === 'about' && 'Scroll up to go back'}
            </span>
          </div>
        </div>
        {/* Hero Section */}
        {(activeSection === 'hero' || !activeSection) && (
          <section className={`bg-white dark:bg-surface-800 px-6 py-12 h-full flex items-center ${
            animationDirection === 'down' ? 'animate-slideInFromBottom' : 'animate-slideInFromTop'
          }`}>
            <div className="max-w-7xl mx-auto text-center w-full">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <span className="text-5xl">🚀</span>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    Welcome to UnifiedWork
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                    AI-Powered Unified Workspace for Tech Teams
                  </p>
                </div>
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
                Choose your community and start working with your specialized AI assistant
              </p>
              
              {/* Navigation Cards */}
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-12">
                <button
                  onClick={() => handleSectionChange('communities')}
                  className="group bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="text-4xl mb-4">🏘️</div>
                  <h3 className="text-xl font-bold mb-2">Explore Communities</h3>
                  <p className="text-blue-100">Discover specialized AI agents for your role</p>
                  <div className="mt-4 flex items-center justify-center">
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                <button
                  onClick={() => handleSectionChange('about')}
                  className="group bg-gradient-to-r from-green-500 to-teal-600 text-white p-8 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold mb-2">Learn More</h3>
                  <p className="text-green-100">Discover how AI enhances team collaboration</p>
                  <div className="mt-4 flex items-center justify-center">
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Welcome Footer */}
              <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl p-8 max-w-4xl mx-auto">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  🎊 Welcome to the Future of Tech Collaboration
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  You're not just using software - you're experiencing the future of tech collaboration. 
                  Each AI agent is specialized for your role, trained on best practices, and ready to help you excel.
                </p>
                <div className="flex items-center justify-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <span className="text-lg">🚀</span>
                    <span className="font-medium">Start small</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <span className="text-lg">📦</span>
                    <span className="font-medium">Ship fast</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <span className="text-lg">✨</span>
                    <span className="font-medium">Make it awesome</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {/* Communities Section */}
        {activeSection === 'communities' && (
          <section className={`bg-white dark:bg-surface-800 px-6 py-12 h-full overflow-y-auto ${
            animationDirection === 'down' ? 'animate-slideInFromBottom' : 'animate-slideInFromTop'
          }`}>
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  🏘️ Choose Your Community
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Each community has a specialized AI agent trained to understand your specific needs and challenges
                </p>
              </div>

              {/* Communities Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {communities.map((community) => (
                  <Link
                    key={community.id}
                    href={`/community/${community.id}`}
                    className="group block"
                  >
                    <div className={`bg-white dark:bg-surface-800 border-2 ${community.borderColor} dark:border-gray-600 rounded-xl p-6 hover:shadow-lg dark:hover:shadow-xl transition-all duration-200 group-hover:scale-105 group-hover:border-opacity-100`}>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-12 h-12 ${community.color} rounded-lg flex items-center justify-center text-2xl`}>
                          {community.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {community.name}
                          </h3>
                          <p className={`text-xs font-medium ${community.textColor}`}>
                            {community.agent}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {community.description}
                      </p>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          Click to start
                        </span>
                        <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                          <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Back to Home Button */}
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Use scroll wheel, arrow keys, or menu buttons to navigate
                </p>
              </div>
            </div>
          </section>
        )}

        {/* About Section */}
        {activeSection === 'about' && (
          <section className={`bg-white dark:bg-surface-800 px-6 py-12 h-full overflow-y-auto ${
            animationDirection === 'down' ? 'animate-slideInFromBottom' : 'animate-slideInFromTop'
          }`}>
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  🎯 Your Mission
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  UnifiedWork is not just a platform - it's a vision of how tech teams should work together, enhanced by AI
                </p>
              </div>

              <div className="max-w-4xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm mb-12">
                <div className="bg-white dark:bg-surface-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <div className="text-2xl mb-3">👨‍💻</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Developers</h3>
                  <p className="text-gray-600 dark:text-gray-400">Get instant code help and architecture guidance</p>
                </div>
                <div className="bg-white dark:bg-surface-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <div className="text-2xl mb-3">🎨</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Designers</h3>
                  <p className="text-gray-600 dark:text-gray-400">Design system guidance and UX best practices</p>
                </div>
                <div className="bg-white dark:bg-surface-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <div className="text-2xl mb-3">🧪</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">QA Engineers</h3>
                  <p className="text-gray-600 dark:text-gray-400">Test automation and quality processes</p>
                </div>
                <div className="bg-white dark:bg-surface-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <div className="text-2xl mb-3">📊</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Product Managers</h3>
                  <p className="text-gray-600 dark:text-gray-400">Requirements and roadmap assistance</p>
                </div>
                <div className="bg-white dark:bg-surface-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <div className="text-2xl mb-3">🤝</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Teams</h3>
                  <p className="text-gray-600 dark:text-gray-400">Collaborate seamlessly across disciplines</p>
                </div>
                <div className="bg-white dark:bg-surface-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <div className="text-2xl mb-3">🚀</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Productivity</h3>
                  <p className="text-gray-600 dark:text-gray-400">AI makes everyone 10x more productive</p>
                </div>
              </div>

              {/* Navigation Info */}
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Use scroll wheel, arrow keys, or menu buttons to navigate
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

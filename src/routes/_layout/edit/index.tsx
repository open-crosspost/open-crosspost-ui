import { Button } from '@/components/ui/button'
import { Edit } from '@/components/Edit'
import { Thing } from '@/types/Thing'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, Save } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import fs from 'fs'

export const Route = createFileRoute('/_layout/edit/')({
  component: EditPage,
})

function EditPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<Thing | null>(null)
  const [loading, setLoading] = useState(true)

  // Load data from thing.json or localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load from thing.json first
        const response = await fetch('/thing.json')
        if (response.ok) {
          const jsonData = await response.json()
          setData(jsonData)
          setLoading(false)
          return
        }
      } catch (error) {
        console.error('Failed to load from thing.json:', error)
      }

      // Fall back to localStorage
      try {
        const savedData = localStorage.getItem('thing-data')
        if (savedData) {
          setData(JSON.parse(savedData))
        } else {
          // Default data if nothing else is available
          setData({
            name: 'New Thing',
            description: 'Description of your new thing',
            image: 'https://placehold.co/400',
            properties: {},
          })
        }
      } catch (error) {
        console.error('Failed to load from localStorage:', error)
        setData({
          name: 'New Thing',
          description: 'Description of your new thing',
          image: 'https://placehold.co/400',
          properties: {},
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSave = (updatedData: Thing) => {
    try {
      // Save to localStorage
      localStorage.setItem('thing-data', JSON.stringify(updatedData))

      // In a real application, you would also save to thing.json
      // This would require a server-side API endpoint
      // For now, we'll just save to localStorage

      navigate({ to: '/' })
    } catch (error) {
      console.error('Failed to save data:', error)
      alert('Failed to save data. Please try again.')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!data) {
    return <div>Error loading data</div>
  }

  return (
    <div className="space-y-8 pt-36">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-between mb-4"
      >
        <Button
          variant="outline"
          className="border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all bg-white"
          onClick={() => navigate({ to: '/' })}
        >
          <ArrowLeft className="w-4 h-4 text-black mr-2" />
          <span className="text-black">Back to View</span>
        </Button>
      </motion.div>

      <h1 className="text-3xl font-bold mb-6">Edit Thing</h1>

      <Edit initialData={data} onSave={handleSave} />
    </div>
  )
}

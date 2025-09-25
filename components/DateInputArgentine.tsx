'use client'

import { Calendar } from 'lucide-react'
import { formatInputDate } from '@/lib/date-utils'
import { useState, useRef } from 'react'

interface DateInputArgentineProps {
  id?: string
  value: string // YYYY-MM-DD format
  onChange: (value: string) => void // Returns YYYY-MM-DD format
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function DateInputArgentine({
  id,
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  className = "",
  disabled = false
}: DateInputArgentineProps) {
  const [showTextInput, setShowTextInput] = useState(false)
  const hiddenDateInputRef = useRef<HTMLInputElement>(null)
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/\D/g, '') // Solo números
    
    // Limitar a 8 dígitos máximo
    if (inputValue.length > 8) return
    
    // Formatear visualmente mientras escribe
    let formatted = inputValue
    if (inputValue.length >= 3) {
      formatted = `${inputValue.slice(0,2)}/${inputValue.slice(2)}`
    }
    if (inputValue.length >= 5) {
      formatted = `${inputValue.slice(0,2)}/${inputValue.slice(2,4)}/${inputValue.slice(4)}`
    }
    
    // Actualizar visualmente el input
    e.target.value = formatted
    
    // Si tiene 8 dígitos (fecha completa), validar y convertir a YYYY-MM-DD
    if (inputValue.length === 8) {
      const day = inputValue.slice(0, 2)
      const month = inputValue.slice(2, 4)
      const year = inputValue.slice(4, 8)
      
      // Validación básica
      const dayNum = parseInt(day)
      const monthNum = parseInt(month)
      const yearNum = parseInt(year)
      
      if (
        dayNum >= 1 && dayNum <= 31 && 
        monthNum >= 1 && monthNum <= 12 && 
        yearNum >= 1900 && yearNum <= 2100
      ) {
        // Validación más estricta con Date
        const testDate = new Date(yearNum, monthNum - 1, dayNum)
        if (
          testDate.getFullYear() === yearNum &&
          testDate.getMonth() === monthNum - 1 &&
          testDate.getDate() === dayNum
        ) {
          onChange(`${year}-${month}-${day}`)
        }
      }
    } else {
      // Si no está completa, limpiar el valor interno
      onChange('')
    }
  }

  const handleCalendarClick = () => {
    // Fallback para navegadores que no soportan showPicker
    if (hiddenDateInputRef.current) {
      if (hiddenDateInputRef.current.showPicker) {
        hiddenDateInputRef.current.showPicker()
      } else {
        // Hacer focus y click en el input de fecha
        hiddenDateInputRef.current.focus()
        hiddenDateInputRef.current.click()
      }
    }
  }

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value // YYYY-MM-DD format
    onChange(dateValue)
  }

  return (
    <div className="space-y-2">
      {/* Input de texto principal con formato argentino */}
      <div className="relative">
        <input
          type="text"
          id={id}
          placeholder={placeholder}
          value={value ? formatInputDate(value) : ''}
          onChange={handleChange}
          disabled={disabled}
          maxLength={10}
          className={`w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10 ${className}`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      {/* Selector de calendario alternativo */}
      <div className="flex items-center space-x-2">
        <input
          ref={hiddenDateInputRef}
          type="date"
          value={value}
          onChange={handleDateInputChange}
          disabled={disabled}
          className="text-sm border-gray-300 rounded px-2 py-1"
        />
        <span className="text-xs text-gray-500">← O usa el selector de calendario</span>
      </div>
    </div>
  )
}
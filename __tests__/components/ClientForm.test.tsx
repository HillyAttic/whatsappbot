import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ClientForm from '@/components/admin/ClientForm'

describe('ClientForm', () => {
  describe('Unit Tests - Form Validation', () => {
    it('should display error when name is empty', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(screen.getByText('Name is required.')).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should display error when phone is empty', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const nameInput = screen.getByLabelText('Name')
      fireEvent.change(nameInput, { target: { value: 'Test User' } })

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(screen.getByText('Phone number is required.')).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should display both errors when both fields are empty', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(screen.getByText('Name is required.')).toBeInTheDocument()
      expect(screen.getByText('Phone number is required.')).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should call onSubmit with normalized phone when form is valid', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const nameInput = screen.getByLabelText('Name')
      const phoneInput = screen.getByLabelText('Phone Number')

      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(phoneInput, { target: { value: '+1 (555) 123-4567' } })

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test User',
        phone: '15551234567',
      })
    })

    it('should trim whitespace from name', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const nameInput = screen.getByLabelText('Name')
      const phoneInput = screen.getByLabelText('Phone Number')

      fireEvent.change(nameInput, { target: { value: '  Test User  ' } })
      fireEvent.change(phoneInput, { target: { value: '1234567890' } })

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test User',
        phone: '1234567890',
      })
    })

    it('should call onCancel when cancel button is clicked', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should populate form with initial values when editing', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()
      const initial = {
        id: '123',
        name: 'Existing User',
        phone: '1234567890',
      }

      render(<ClientForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />)

      const nameInput = screen.getByLabelText('Name') as HTMLInputElement
      const phoneInput = screen.getByLabelText('Phone Number') as HTMLInputElement

      expect(nameInput.value).toBe('Existing User')
      expect(phoneInput.value).toBe('1234567890')
      expect(screen.getByText('Update')).toBeInTheDocument()
    })

    it('should clear errors when user starts typing', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

      // Submit to trigger errors
      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(screen.getByText('Name is required.')).toBeInTheDocument()

      // Start typing in name field
      const nameInput = screen.getByLabelText('Name')
      fireEvent.change(nameInput, { target: { value: 'T' } })

      // Submit again to re-validate
      fireEvent.click(submitButton)

      // Name error should be gone, but phone error should still be there
      expect(screen.queryByText('Name is required.')).not.toBeInTheDocument()
      expect(screen.getByText('Phone number is required.')).toBeInTheDocument()
    })
  })
})

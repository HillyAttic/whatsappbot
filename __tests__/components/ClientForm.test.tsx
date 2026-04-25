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

      const nameInput = screen.getByLabelText('Full Name')
      fireEvent.change(nameInput, { target: { value: 'Test User' } })

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(screen.getByText('At least one phone number is required')).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should display both errors when both fields are empty', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(screen.getByText('Name is required.')).toBeInTheDocument()
      expect(screen.getByText('At least one phone number is required')).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should accept valid phone number with 91 prefix', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const nameInput = screen.getByLabelText('Full Name')
      const phoneInputs = screen.getAllByPlaceholderText('919823860000 or 9823860000')

      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(phoneInputs[0], { target: { value: '919823860000' } })

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test User',
        phones: ['919823860000'],
        gstNumber: undefined
      })
    })

    it('should accept phone number with +91 and strip the plus sign', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const nameInput = screen.getByLabelText('Full Name')
      const phoneInputs = screen.getAllByPlaceholderText('919823860000 or 9823860000')

      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(phoneInputs[0], { target: { value: '+919823860000' } })

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test User',
        phones: ['919823860000'],
        gstNumber: undefined
      })
    })

    it('should auto-format 10-digit number to include 91 prefix', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const nameInput = screen.getByLabelText('Full Name')
      const phoneInputs = screen.getAllByPlaceholderText('919823860000 or 9823860000')

      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(phoneInputs[0], { target: { value: '9823860000' } })

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test User',
        phones: ['919823860000'],
        gstNumber: undefined
      })
    })

    it('should reject phone number without 91 country code', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const nameInput = screen.getByLabelText('Full Name')
      const phoneInputs = screen.getAllByPlaceholderText('919823860000 or 9823860000')

      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(phoneInputs[0], { target: { value: '819823860000' } })

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(screen.getByText('Phone number must include country code (start with 91)')).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should reject phone number with incorrect length', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const nameInput = screen.getByLabelText('Full Name')
      const phoneInputs = screen.getAllByPlaceholderText('919823860000 or 9823860000')

      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(phoneInputs[0], { target: { value: '9198238' } })

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(screen.getByText('Phone number must be exactly 12 digits (91 + 10 digits)')).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should detect duplicate phone numbers with and without plus sign', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const nameInput = screen.getByLabelText('Full Name')

      fireEvent.change(nameInput, { target: { value: 'Test User' } })

      // Add first phone
      const phoneInputs = screen.getAllByPlaceholderText('919823860000 or 9823860000')
      fireEvent.change(phoneInputs[0], { target: { value: '919823860000' } })

      // Add second phone field
      const addButton = screen.getByText('Add Phone Number')
      fireEvent.click(addButton)

      // Try to add duplicate with +91
      const updatedPhoneInputs = screen.getAllByPlaceholderText('919823860000 or 9823860000')
      fireEvent.change(updatedPhoneInputs[1], { target: { value: '+919823860000' } })

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(screen.getByText('This phone number is already added')).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should trim whitespace from name', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const nameInput = screen.getByLabelText('Full Name')
      const phoneInputs = screen.getAllByPlaceholderText('919823860000 or 9823860000')

      fireEvent.change(nameInput, { target: { value: '  Test User  ' } })
      fireEvent.change(phoneInputs[0], { target: { value: '919823860000' } })

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test User',
        phones: ['919823860000'],
        gstNumber: undefined
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
        phones: ['919823860000'],
        gstNumber: '22AAAAA0000A1Z5'
      }

      render(<ClientForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />)

      const nameInput = screen.getByLabelText('Full Name') as HTMLInputElement
      const phoneInputs = screen.getAllByPlaceholderText('919823860000 or 9823860000')
      const gstInput = screen.getByLabelText('GST Number (Optional)') as HTMLInputElement

      expect(nameInput.value).toBe('Existing User')
      expect(phoneInputs[0].value).toBe('919823860000')
      expect(gstInput.value).toBe('22AAAAA0000A1Z5')
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
      const nameInput = screen.getByLabelText('Full Name')
      fireEvent.change(nameInput, { target: { value: 'T' } })

      // Submit again to re-validate
      fireEvent.click(submitButton)

      // Name error should be gone, but phone error should still be there
      expect(screen.queryByText('Name is required.')).not.toBeInTheDocument()
      expect(screen.getByText('At least one phone number is required')).toBeInTheDocument()
    })

    it('should handle multiple phone numbers', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const nameInput = screen.getByLabelText('Full Name')
      fireEvent.change(nameInput, { target: { value: 'Test User' } })

      // Add first phone
      const phoneInputs = screen.getAllByPlaceholderText('919823860000 or 9823860000')
      fireEvent.change(phoneInputs[0], { target: { value: '919823860000' } })

      // Add second phone field
      const addButton = screen.getByText('Add Phone Number')
      fireEvent.click(addButton)

      // Add second phone
      const updatedPhoneInputs = screen.getAllByPlaceholderText('919823860000 or 9823860000')
      fireEvent.change(updatedPhoneInputs[1], { target: { value: '919876543210' } })

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test User',
        phones: ['919823860000', '919876543210'],
        gstNumber: undefined
      })
    })
  })
})

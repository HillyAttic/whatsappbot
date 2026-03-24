import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DocumentForm from '@/components/admin/DocumentForm'

describe('DocumentForm', () => {
  describe('Unit Tests - Form Validation', () => {
    it('should display error when title is empty', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DocumentForm onSubmit={onSubmit} onCancel={onCancel} />)

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(screen.getByText('Title is required.')).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should display error when file is missing for new document', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DocumentForm onSubmit={onSubmit} onCancel={onCancel} />)

      const titleInput = screen.getByLabelText('Title')
      fireEvent.change(titleInput, { target: { value: 'Test Document' } })

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(screen.getByText('File is required.')).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should display both errors when both fields are empty', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DocumentForm onSubmit={onSubmit} onCancel={onCancel} />)

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(screen.getByText('Title is required.')).toBeInTheDocument()
      expect(screen.getByText('File is required.')).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should call onSubmit with title and file when form is valid', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DocumentForm onSubmit={onSubmit} onCancel={onCancel} />)

      const titleInput = screen.getByLabelText('Title')
      const fileInput = screen.getByLabelText('File') as HTMLInputElement

      fireEvent.change(titleInput, { target: { value: 'Test Document' } })

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })
      fireEvent.change(fileInput)

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Test Document',
        file: expect.any(File),
      })
    })

    it('should trim whitespace from title', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DocumentForm onSubmit={onSubmit} onCancel={onCancel} />)

      const titleInput = screen.getByLabelText('Title')
      const fileInput = screen.getByLabelText('File') as HTMLInputElement

      fireEvent.change(titleInput, { target: { value: '  Test Document  ' } })

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })
      fireEvent.change(fileInput)

      const submitButton = screen.getByText('Create')
      fireEvent.click(submitButton)

      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Test Document',
        file: expect.any(File),
      })
    })

    it('should call onCancel when cancel button is clicked', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<DocumentForm onSubmit={onSubmit} onCancel={onCancel} />)

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
        phone: '1234567890',
        title: 'Existing Document',
        filePath: 'users/123/documents/test.pdf',
      }

      render(<DocumentForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />)

      const titleInput = screen.getByLabelText(/Title/) as HTMLInputElement

      expect(titleInput.value).toBe('Existing Document')
      expect(screen.getByText('Update')).toBeInTheDocument()
      expect(screen.getByText(/optional/)).toBeInTheDocument()
    })

    it('should not require file when editing existing document', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()
      const initial = {
        id: '123',
        phone: '1234567890',
        title: 'Existing Document',
        filePath: 'users/123/documents/test.pdf',
      }

      render(<DocumentForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />)

      const titleInput = screen.getByLabelText(/Title/)
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } })

      const submitButton = screen.getByText('Update')
      fireEvent.click(submitButton)

      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Updated Title',
        file: null,
      })
      expect(screen.queryByText('File is required.')).not.toBeInTheDocument()
    })

    it('should allow file replacement when editing', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()
      const initial = {
        id: '123',
        phone: '1234567890',
        title: 'Existing Document',
        filePath: 'users/123/documents/test.pdf',
      }

      render(<DocumentForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />)

      const titleInput = screen.getByLabelText(/Title/)
      const fileInput = screen.getByLabelText(/File/) as HTMLInputElement

      fireEvent.change(titleInput, { target: { value: 'Updated Title' } })

      const newFile = new File(['new content'], 'new.pdf', { type: 'application/pdf' })
      Object.defineProperty(fileInput, 'files', {
        value: [newFile],
        writable: false,
      })
      fireEvent.change(fileInput)

      const submitButton = screen.getByText('Update')
      fireEvent.click(submitButton)

      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Updated Title',
        file: expect.any(File),
      })
    })
  })
})

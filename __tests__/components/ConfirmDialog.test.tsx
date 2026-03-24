import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

describe('ConfirmDialog', () => {
  describe('Unit Tests', () => {
    it('should display the message', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()
      const message = 'Are you sure you want to delete this item?'

      render(<ConfirmDialog message={message} onConfirm={onConfirm} onCancel={onCancel} />)

      expect(screen.getByText(message)).toBeInTheDocument()
    })

    it('should call onConfirm when Confirm button is clicked', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      render(<ConfirmDialog message="Test message" onConfirm={onConfirm} onCancel={onCancel} />)

      const confirmButton = screen.getByText('Confirm')
      fireEvent.click(confirmButton)

      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(onCancel).not.toHaveBeenCalled()
    })

    it('should call onCancel when Cancel button is clicked', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      render(<ConfirmDialog message="Test message" onConfirm={onConfirm} onCancel={onCancel} />)

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(onCancel).toHaveBeenCalledTimes(1)
      expect(onConfirm).not.toHaveBeenCalled()
    })

    it('should render with modal overlay', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      const { container } = render(
        <ConfirmDialog message="Test message" onConfirm={onConfirm} onCancel={onCancel} />
      )

      // Check for overlay with specific classes
      const overlay = container.querySelector('.fixed.inset-0.bg-black.bg-opacity-50')
      expect(overlay).toBeInTheDocument()
    })

    it('should render both buttons', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      render(<ConfirmDialog message="Test message" onConfirm={onConfirm} onCancel={onCancel} />)

      expect(screen.getByText('Confirm')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should handle long messages', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()
      const longMessage = 'This is a very long message that should still be displayed correctly in the dialog. '.repeat(5)

      const { container } = render(<ConfirmDialog message={longMessage} onConfirm={onConfirm} onCancel={onCancel} />)

      expect(container).toHaveTextContent(longMessage.trim())
    })

    it('should handle empty message', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      render(<ConfirmDialog message="" onConfirm={onConfirm} onCancel={onCancel} />)

      // Dialog should still render with buttons
      expect(screen.getByText('Confirm')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })
})

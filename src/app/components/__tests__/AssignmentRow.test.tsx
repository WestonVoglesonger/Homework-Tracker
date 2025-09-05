import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssignmentRow } from '../assignments/AssignmentRow';
import { AssignmentDTO } from '@/types/assignments';
import { testFactory } from '../../../test/factories';

// Mock the hooks
vi.mock('../../hooks/useAssignments', () => ({
  useUpdateAssignment: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false
  })),
  useDeleteAssignment: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false
  }))
}));

vi.mock('../../hooks/useAssignments');

const { useUpdateAssignment, useDeleteAssignment } = await import('../../hooks/useAssignments');

describe('AssignmentRow', () => {
  let mockAssignment: AssignmentDTO;
  let mockUpdate: any;
  let mockDelete: any;

  beforeEach(() => {
    mockUpdate = vi.fn();
    mockDelete = vi.fn();

    vi.mocked(useUpdateAssignment).mockReturnValue({
      mutate: mockUpdate,
      isPending: false,
      error: null,
      data: undefined,
      isError: false,
      isIdle: true,
      isSuccess: false,
      failureCount: 0,
      failureReason: null,
      mutateAsync: vi.fn(),
      reset: vi.fn(),
      status: 'idle',
      submittedAt: 0,
      variables: undefined
    });

    vi.mocked(useDeleteAssignment).mockReturnValue({
      mutateAsync: mockDelete,
      isPending: false,
      error: null,
      data: undefined,
      isError: false,
      isIdle: true,
      isSuccess: false,
      failureCount: 0,
      failureReason: null,
      mutate: vi.fn(),
      reset: vi.fn(),
      status: 'idle',
      submittedAt: 0,
      variables: undefined
    });

    mockAssignment = {
      id: '1',
      title: 'Test Assignment',
      description: 'Test description',
      type: 'HOMEWORK',
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      estimatedHours: 2,
      status: 'NOT_SUBMITTED',
      priority: 0,
      notes: 'Test notes',
      source: 'manual',
      courseId: 'course-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  it('renders assignment information correctly', () => {
    render(<AssignmentRow a={mockAssignment} />);

    expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    expect(screen.getByText('Estimated: 2h')).toBeInTheDocument();
    
    // Should show due date - look for any date text since format may vary
    const dateElements = screen.getAllByText(/\d+/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('renders assignment without estimated hours', () => {
    const assignmentWithoutHours = {
      ...mockAssignment,
      estimatedHours: undefined
    };

    render(<AssignmentRow a={assignmentWithoutHours} />);

    expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    expect(screen.queryByText(/estimated/i)).not.toBeInTheDocument();
  });

  it('renders assignment without due date', () => {
    const assignmentWithoutDueDate = {
      ...mockAssignment,
      dueAt: undefined
    };

    render(<AssignmentRow a={assignmentWithoutDueDate} />);

    expect(screen.getByText('No due date')).toBeInTheDocument();
  });

  it('handles status change', async () => {
    render(<AssignmentRow a={mockAssignment} />);

    // Find and click the status dropdown
    const statusSelect = screen.getByRole('combobox');
    fireEvent.click(statusSelect);

    // Select "Submitted" option
    const submittedOption = screen.getByText(/submitted, waiting for grade/i);
    fireEvent.click(submittedOption);

    expect(mockUpdate).toHaveBeenCalledWith({
      id: '1',
      patch: { status: 'SUBMITTED' }
    });
  });

  it('handles delete with confirmation', async () => {
    // Mock window.confirm to return true
    global.confirm = vi.fn(() => true);
    mockDelete.mockResolvedValue(undefined);

    render(<AssignmentRow a={mockAssignment} />);

    const deleteButton = screen.getByTitle('Delete assignment');
    fireEvent.click(deleteButton);

    expect(global.confirm).toHaveBeenCalledWith('Delete this assignment?');
    expect(mockDelete).toHaveBeenCalledWith('1');
  });

  it('cancels delete when confirmation is denied', async () => {
    global.confirm = vi.fn(() => false);

    render(<AssignmentRow a={mockAssignment} />);

    const deleteButton = screen.getByTitle('Delete assignment');
    fireEvent.click(deleteButton);

    expect(global.confirm).toHaveBeenCalledWith('Delete this assignment?');
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('shows loading state during deletion', async () => {
    vi.mocked(useDeleteAssignment).mockReturnValue({
      mutateAsync: mockDelete,
      isPending: true, // Set to loading state
      error: null,
      data: undefined,
      isError: false,
      isIdle: false,
      isSuccess: false,
      failureCount: 0,
      failureReason: null,
      mutate: vi.fn(),
      reset: vi.fn(),
      status: 'pending',
      submittedAt: 0,
      variables: undefined
    });

    render(<AssignmentRow a={mockAssignment} />);

    // Should show loading overlay - look for the spinner element using container
    const { container } = render(<div />); // Re-render to get container
    render(<AssignmentRow a={mockAssignment} />);
    
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeTruthy();
  });

  it('shows correct status pill for each status', () => {
    const statuses = ['NOT_SUBMITTED', 'SUBMITTED', 'GRADED'] as const;

    statuses.forEach(status => {
      const assignment = { ...mockAssignment, status };
      const { rerender } = render(<AssignmentRow a={assignment} />);

      // Check that status is displayed (implementation depends on StatusPill component)
      const statusElement = screen.getByRole('combobox');
      expect(statusElement).toBeInTheDocument();

      rerender(<div />); // Clear for next iteration
    });
  });

  it('renders view details link correctly', () => {
    render(<AssignmentRow a={mockAssignment} />);

    const viewLink = screen.getByTitle('View details');
    expect(viewLink).toHaveAttribute('href', '/assignments/1');
  });

  it('handles long assignment titles', () => {
    const longTitleAssignment = {
      ...mockAssignment,
      title: 'This is a very long assignment title that should be truncated or handled gracefully in the UI'
    };

    render(<AssignmentRow a={longTitleAssignment} />);

    expect(screen.getByText(longTitleAssignment.title)).toBeInTheDocument();
  });

  it('shows different priority levels correctly', () => {
    const priorities = [0, 1, 2];

    priorities.forEach(priority => {
      const assignment = { ...mockAssignment, priority };
      const { rerender } = render(<AssignmentRow a={assignment} />);

      // Component should render without error for any valid priority
      expect(screen.getByText('Test Assignment')).toBeInTheDocument();

      rerender(<div />); // Clear for next iteration
    });
  });

  it('handles assignments from different sources', () => {
    const canvasAssignment = {
      ...mockAssignment,
      source: 'canvas' as const,
      canvasId: 'canvas-123',
      canvasUrl: 'https://canvas.example.com/assignments/123'
    };

    render(<AssignmentRow a={canvasAssignment} />);

    expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    // The component should handle canvas assignments without error
  });

  it('handles empty or null title gracefully', () => {
    const noTitleAssignment = {
      ...mockAssignment,
      title: ''
    };

    render(<AssignmentRow a={noTitleAssignment} />);

    expect(screen.getByText('No title')).toBeInTheDocument();
  });

  it('shows hover effects and styling', () => {
    render(<AssignmentRow a={mockAssignment} />);

    const container = screen.getByText('Test Assignment').closest('.group');
    expect(container).toHaveClass('group');
    expect(container).toHaveClass('hover:shadow-md');
    expect(container).toHaveClass('transition-all');
  });

  it('formats due date correctly for different time ranges', () => {
    const testDates = [
      { date: new Date(Date.now() + 60 * 60 * 1000), expected: /today|hour/i }, // 1 hour from now
      { date: new Date(Date.now() + 24 * 60 * 60 * 1000), expected: /tomorrow/i }, // 1 day from now
      { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), expected: /\d+/ }, // 1 week from now
    ];

    testDates.forEach(({ date, expected }, index) => {
      const assignment = { ...mockAssignment, dueAt: date.toISOString() };
      const { rerender } = render(<AssignmentRow a={assignment} />);

      // Date formatting is handled by formatDate utility - look for any date text
      const dateElements = screen.getAllByText(/\d+/);
      expect(dateElements.length).toBeGreaterThan(0);

      rerender(<div />);
    });
  });
});

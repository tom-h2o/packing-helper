import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import NewTrip from '../pages/NewTrip';
import * as db from '../lib/db';

vi.mock('../lib/db', () => ({
  fetchTags: vi.fn(),
  createTrip: vi.fn(),
  generateListForTrip: vi.fn(),
}));

describe('NewTrip Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and fetches tags on mount', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.fetchTags as any).mockResolvedValue([
      { id: '1', name: 'Hot', type: 'temperature' },
      { id: '2', name: 'Beach', type: 'activity' }
    ]);

    render(
      <MemoryRouter>
        <NewTrip />
      </MemoryRouter>
    );

    expect(screen.getByText('Create New Trip')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Hot')).toBeInTheDocument();
      expect(screen.getByText('Beach')).toBeInTheDocument();
    });
  });

  it('submits valid forms and navigates', async () => {
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     (db.fetchTags as any).mockResolvedValue([{ id: '1', name: 'Warm', type: 'temperature' }]);
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     (db.createTrip as any).mockResolvedValue({ id: 'trip123' });
     
     render(
      <MemoryRouter initialEntries={['/new-trip']}>
        <Routes>
          <Route path="/new-trip" element={<NewTrip />} />
          <Route path="/trip/:id" element={<div>Destination Trip Viewer</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Warm')).toBeInTheDocument());

    // Enter name
    fireEvent.change(screen.getByPlaceholderText('e.g. Summer in Spain'), { target: { value: 'Test Trip' }});
    // Enter Dates (Start Date is index 1 essentially since we use label)
    const startDateInput = screen.getByLabelText('Start Date');
    fireEvent.change(startDateInput, { target: { value: '2025-05-10' }});

    // Select Temp
    fireEvent.click(screen.getByText('Warm'));

    // Submit
    fireEvent.click(screen.getByText('Generate Packing List'));

    await waitFor(() => {
      expect(db.createTrip).toHaveBeenCalledWith({
        name: 'Test Trip',
        date_start: '2025-05-10',
        date_end: '2025-05-10',
        temperature: 'Warm',
        activities: []
      });
      // The trip wizard should push to /trip/trip123 meaning this renders
      expect(screen.getByText('Destination Trip Viewer')).toBeInTheDocument();
    });
  });
});

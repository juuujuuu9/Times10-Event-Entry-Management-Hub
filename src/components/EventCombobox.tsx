import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { EventOption } from '@/components/AdminPage';

interface EventComboboxProps {
  events: EventOption[];
  value: string;
  onSelect: (eventId: string) => void;
}

export function EventCombobox({
  events,
  value,
  onSelect,
}: EventComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedEvent = value ? events.find((e) => e.id === value) : null;
  const filtered =
    query.trim() === ''
      ? events
      : events.filter(
          (e) =>
            e.name.toLowerCase().includes(query.toLowerCase()) ||
            e.slug.toLowerCase().includes(query.toLowerCase())
        );

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={open ? query : selectedEvent?.name ?? ''}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={selectedEvent ? 'Search events...' : 'Select event...'}
          className="pl-9 w-[220px]"
        />
      </div>
      {open && (
        <ul
          className="absolute z-50 mt-1 max-h-48 w-[220px] overflow-auto rounded-md border bg-popover py-1 shadow-md"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              No events found
            </li>
          ) : (
            <>
              <li
                role="option"
                aria-selected={!value}
                className={`cursor-pointer px-3 py-2 text-sm hover:bg-accent ${
                  !value ? 'bg-accent' : ''
                }`}
                onClick={() => {
                  onSelect('');
                  setQuery('');
                  setOpen(false);
                }}
              >
                Select Event
              </li>
              {filtered.map((ev) => (
                <li
                  key={ev.id}
                  role="option"
                  aria-selected={ev.id === value}
                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-accent ${
                    ev.id === value ? 'bg-accent' : ''
                  }`}
                  onClick={() => {
                    onSelect(ev.id);
                    setQuery('');
                    setOpen(false);
                  }}
                >
                  {ev.name}
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
}

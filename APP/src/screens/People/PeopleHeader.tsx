import React from 'react';
import { Hero, SearchBar } from '../../components/UI';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useApp } from '../../context/AppContext';

const views = [{ value: 'people', label: 'Discover' }, { value: 'chat', label: 'Messages' }] as const;

export function PeopleHeader({ view, search, onSearch, onScan }: {
  view: (typeof views)[number]['value']; search: string;
  onSearch: (value: string) => void; onScan: () => void;
}) {
  const { setPage, tabActivity } = useApp();
  const options = [
    { ...views[0], label: tabActivity.people ? 'Discover •' : 'Discover' },
    { ...views[1], label: tabActivity.chat ? 'Messages •' : 'Messages' },
  ];
  return <>
    <Hero eyebrow="YOUR CIRCLE" first="People who" accent="resonate" />
    <SegmentedControl label="People view" options={options} value={view} onChange={setPage} />
    <SearchBar value={search} onChange={onSearch}
      placeholder={view === 'people' ? 'Search people' : 'Search chat'} qr={onScan} />
  </>;
}

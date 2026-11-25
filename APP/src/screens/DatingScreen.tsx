import React, { useState } from 'react';
import { Hero, SearchBar } from '../components/UI';
import { Dating } from './People/Dating';

export default function DatingScreen() {
  const [search, setSearch] = useState('');
  return <>
    <Hero eyebrow="DATING" first="Meet someone" accent="new" />
    <SearchBar value={search} onChange={setSearch} placeholder="Search Dating" />
    <Dating search={search} />
  </>;
}

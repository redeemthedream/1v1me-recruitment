export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: 'grid', path: '/' },
    ],
  },
  {
    label: 'Players',
    items: [
      { key: 'roster', label: 'Partners', icon: 'users', path: '/partners' },
      { key: 'prospects', label: 'Prospects', icon: 'search', path: '/prospects' },
      { key: 'compare', label: 'Compare', icon: 'columns', path: '/compare' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { key: 'games', label: 'Games', icon: 'gamepad', path: '/games' },
      { key: 'tags', label: 'Tags', icon: 'tag', path: '/tags' },
      { key: 'activity', label: 'Activity Log', icon: 'clock', path: '/activity' },
    ],
  },
]

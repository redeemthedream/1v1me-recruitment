import { exportToCsv } from '../utils/csv'

export function useExport() {
  function exportPlayers(players, games) {
    const gameMap = Object.fromEntries((games || []).map(g => [g.id, g.name]))
    const columns = [
      { label: 'IGN', accessor: r => r.ign },
      { label: 'Real Name', accessor: r => r.real_name },
      { label: 'Category', accessor: r => r.category },
      { label: 'Game', accessor: r => gameMap[r.game_id] || '' },
      { label: 'Platform', accessor: r => r.platform },
      { label: 'Role', accessor: r => r.role },
      { label: 'Region', accessor: r => r.region },
      { label: 'Tier', accessor: r => r.tier },
      { label: 'Player Status', accessor: r => r.player_status },
      { label: 'Recruitment Status', accessor: r => r.recruitment_status },
      { label: 'Priority', accessor: r => r.priority },
      { label: 'Age', accessor: r => r.age },
      { label: 'Country', accessor: r => r.country },
      { label: 'Current Org', accessor: r => r.current_org },
      { label: 'Contract', accessor: r => r.has_contract ? 'Yes' : 'No' },
      { label: 'Contract Expiry', accessor: r => r.contract_expiry },
      { label: 'Twitter', accessor: r => r.twitter_url },
      { label: 'Twitch', accessor: r => r.twitch_url },
      { label: 'YouTube', accessor: r => r.youtube_url },
      { label: 'TikTok', accessor: r => r.tiktok_url },
      { label: 'Discord', accessor: r => r.discord_tag },
    ]
    exportToCsv(`players_export_${Date.now()}.csv`, players, columns)
  }

  return { exportPlayers }
}

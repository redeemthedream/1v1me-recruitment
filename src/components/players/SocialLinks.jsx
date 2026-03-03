import { formatNumber } from '../../utils/formatters'

const SOCIALS = [
  { key: 'twitter', label: 'X', urlKey: 'twitter_url', countKey: 'twitter_followers' },
  { key: 'twitch', label: 'TTV', urlKey: 'twitch_url', countKey: 'twitch_followers' },
  { key: 'youtube', label: 'YT', urlKey: 'youtube_url', countKey: 'youtube_followers' },
  { key: 'tiktok', label: 'TT', urlKey: 'tiktok_url', countKey: 'tiktok_followers' },
]

export default function SocialLinks({ player, compact = false }) {
  const links = SOCIALS.filter(s => player[s.urlKey])
  if (links.length === 0 && !player.discord_tag) return <span className="text-text-muted">-</span>

  if (compact) {
    return (
      <div className="flex gap-1">
        {links.map(s => (
          <a
            key={s.key}
            href={player[s.urlKey]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] px-1.5 py-0.5 rounded bg-bg-hover text-neon hover:text-neon/80 no-underline"
            title={`${s.label}: ${formatNumber(player[s.countKey])}`}
          >
            {s.label}
          </a>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(s => (
        <a
          key={s.key}
          href={player[s.urlKey]}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-hover border border-border text-sm no-underline text-text-primary hover:border-neon transition-colors"
        >
          <span className="text-neon font-medium">{s.label}</span>
          {player[s.countKey] && (
            <span className="text-text-secondary">{formatNumber(player[s.countKey])}</span>
          )}
        </a>
      ))}
      {player.discord_tag && (
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-hover border border-border text-sm">
          <span className="text-purple font-medium">DC</span>
          <span className="text-text-secondary">{player.discord_tag}</span>
        </span>
      )}
    </div>
  )
}

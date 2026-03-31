/**
 * Creighton Model stamp visual component.
 *
 * Stamp colors and their meaning:
 *   red        - Menstruation (H/M/L/VL)
 *   brown      - Brown/spotting bleeding
 *   green      - Dry day (no mucus)
 *   white_baby - Mucus/fertile (white circle with baby symbol)
 *                When is_peak_day=true, shows a P badge on top of the stamp
 *   green_baby - Post-peak days 1–3 (green circle with baby symbol)
 *                stamp_symbol holds '1', '2', or '3' — shown above the stamp
 *   yellow     - Special / unusual discharge
 *   white      - Plain white (beginning or end of special cases)
 */

const STAMP_STYLES = {
  red: {
    bg: 'bg-red-600',
    border: 'border-red-700',
    text: 'text-white',
  },
  brown: {
    bg: 'bg-amber-800',
    border: 'border-amber-900',
    text: 'text-white',
  },
  green: {
    bg: 'bg-green-600',
    border: 'border-green-700',
    text: 'text-white',
  },
  white_baby: {
    bg: 'bg-white',
    border: 'border-gray-400',
    text: 'text-gray-800',
  },
  green_baby: {
    bg: 'bg-green-600',
    border: 'border-green-700',
    text: 'text-white',
  },
  yellow: {
    bg: 'bg-yellow-400',
    border: 'border-yellow-500',
    text: 'text-gray-800',
  },
  white: {
    bg: 'bg-white',
    border: 'border-gray-300',
    text: 'text-gray-800',
  },
};

export default function CreightonStamp({ observation, size = 'md' }) {
  if (!observation) {
    return (
      <div
        className={`
          rounded-full border-2 border-dashed border-gray-200 bg-gray-50
          ${size === 'sm' ? 'w-8 h-8' : 'w-12 h-12'}
          flex items-center justify-center
        `}
      />
    );
  }

  const {
    stamp_color, stamp_symbol,
    observation_number, observation_letters, observation_frequency,
    is_peak_day,
  } = observation;

  const style = STAMP_STYLES[stamp_color] || STAMP_STYLES.white;
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm';

  // Inner label inside the circle
  let innerLabel = null;
  if (stamp_color === 'red' || stamp_color === 'brown') {
    innerLabel = <span className="leading-none font-bold">{stamp_symbol || ''}</span>;
  } else if (stamp_color === 'white_baby' || stamp_color === 'green_baby') {
    innerLabel = <span className="text-base leading-none">👶</span>;
  } else if (stamp_color === 'yellow') {
    innerLabel = <span className="leading-none">{stamp_symbol || ''}</span>;
  }

  // Build observation code string
  const obsCode = [
    observation_number,
    observation_letters,
    observation_frequency ? ` ${observation_frequency}` : '',
  ].filter(Boolean).join('');

  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Post-peak day number above green_baby stamp */}
      {stamp_color === 'green_baby' && stamp_symbol && (
        <span className="text-xs font-bold text-green-700 leading-none">{stamp_symbol}</span>
      )}

      {/* The stamp circle — relative so we can overlay the P badge */}
      <div className="relative flex items-center justify-center">
        <div
          className={`
            rounded-full border-2 ${style.bg} ${style.border} ${style.text} ${sizeClass}
            flex items-center justify-center font-bold select-none shadow-sm
          `}
          title={`${stamp_color}${stamp_symbol ? ' ' + stamp_symbol : ''}${obsCode ? ' ' + obsCode : ''}`}
        >
          {innerLabel}
        </div>

        {/* P badge on top of white_baby when it's peak day */}
        {stamp_color === 'white_baby' && is_peak_day && (
          <span
            className={`
              absolute -top-2 left-1/2 -translate-x-1/2
              bg-rose-600 text-white font-bold rounded-full
              ${size === 'sm' ? 'text-[9px] w-3.5 h-3.5' : 'text-[10px] w-4 h-4'}
              flex items-center justify-center shadow
            `}
          >
            P
          </span>
        )}
      </div>

      {/* Observation code below stamp */}
      {obsCode && (
        <span className="text-xs font-mono text-gray-700 leading-none">
          {obsCode}
        </span>
      )}

      {/* P below stamp for non-white_baby peak days (fallback) */}
      {is_peak_day && stamp_color !== 'white_baby' && (
        <span className="text-xs font-bold text-rose-600 leading-none">P</span>
      )}
    </div>
  );
}

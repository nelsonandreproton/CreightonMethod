/**
 * Creighton Model stamp visual component.
 *
 * Stamp colors and their meaning:
 *   red        - Menstruation (H/M/L/VL)
 *   brown      - Brown/spotting bleeding
 *   green      - Dry day (no mucus)
 *   white_baby - Mucus/fertile (white circle with baby symbol)
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

  const { stamp_color, stamp_symbol, observation_number, observation_letters, is_peak_day } = observation;
  const style = STAMP_STYLES[stamp_color] || STAMP_STYLES.white;

  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm';

  // Build the label inside the stamp
  let innerLabel = '';
  if (stamp_color === 'red' || stamp_color === 'brown') {
    innerLabel = stamp_symbol || '';
  } else if (stamp_color === 'white_baby') {
    innerLabel = '👶';
  } else if (stamp_color === 'green') {
    innerLabel = '';
  } else if (stamp_color === 'yellow') {
    innerLabel = stamp_symbol || '';
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={`
          rounded-full border-2 ${style.bg} ${style.border} ${style.text} ${sizeClass}
          flex items-center justify-center font-bold relative select-none
          shadow-sm
        `}
        title={`Day observation: ${stamp_color}${stamp_symbol ? ' ' + stamp_symbol : ''}`}
      >
        {stamp_color === 'white_baby' ? (
          <span className="text-base leading-none">👶</span>
        ) : (
          <span className="leading-none">{innerLabel}</span>
        )}
      </div>
      {/* Observation code below stamp */}
      {(observation_number || observation_letters) && (
        <span className="text-xs font-mono text-gray-700 leading-none">
          {observation_number}{observation_letters}
        </span>
      )}
      {/* Peak day marker */}
      {is_peak_day && (
        <span className="text-xs font-bold text-rose-600 leading-none">P</span>
      )}
    </div>
  );
}

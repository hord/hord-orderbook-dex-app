import { getTrackBackground, Range as CustomRange } from 'react-range'

import * as S from './styles'

const STEP = 0.1
const MIN = 0
const MAX = 100

const Range = ({ values, setValues }) => {
  return (
    <S.Wrapper>
      <CustomRange
        values={values}
        step={STEP}
        min={MIN}
        max={MAX}
        onChange={(values) => setValues({ values })}
        renderTrack={({ props, children }) => (
          <div
            onMouseDown={props.onMouseDown}
            onTouchStart={props.onTouchStart}
            style={{
              ...props.style,
              height: '36px',
              display: 'flex',
              width: '100%',
            }}
          >
            <div
              ref={props.ref}
              style={{
                height: '5px',
                width: '100%',
                borderRadius: '4px',
                background: getTrackBackground({
                  values: values,
                  colors: ['#E6007A', '#1C2023'],
                  min: MIN,
                  max: MAX,
                }),
                alignSelf: 'center',
              }}
            >
              {children}
            </div>
          </div>
        )}
        renderThumb={({ props, isDragged }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: '20px',
              width: '35px',
              borderRadius: '4px',
              backgroundColor: '#E6007A',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 0.5rem 1rem rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                backgroundColor: isDragged ? '#E6007A' : '#1C2023',
              }}
            />
            <output style={{ fontSize: '1rem', color: 'white', fontWeight: 500 }}>{values[0].toFixed(2)}%</output>
          </div>
        )}
      />
    </S.Wrapper>
  )
}

export default Range

import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export default function BrandMark({ size = 132 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Circle cx="256" cy="244" r="174" fill="#0D438A" stroke="#FFB21A" strokeWidth="10" />
      <Path
        d="M256 105 354 147v82c0 70-43 125-98 155-55-30-98-85-98-155v-82z"
        fill="#F8FBFF"
        stroke="#FFB21A"
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <Path d="M207 239h32v-28h34v28h32v65h-98z" fill="#DCEBFF" />
      <Path
        d="M223 239v-12h14v12m17 0v-14h14v14m-47 24h9m13 0h9m13 0h9m-53 17h9m13 0h9m13 0h9"
        fill="none"
        stroke="#1264D5"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <Path
        d="m220 296 25 24 50-57"
        fill="none"
        stroke="#1264D5"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="148" y="414" width="68" height="12" rx="6" fill="#FF9933" />
      <Rect x="222" y="414" width="68" height="12" rx="6" fill="#FFFFFF" />
      <Rect x="296" y="414" width="68" height="12" rx="6" fill="#138808" />
    </Svg>
  );
}

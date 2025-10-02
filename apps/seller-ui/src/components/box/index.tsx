'use client';

import styled from 'styled-components';

interface BoxProps {
  $css?: React.CSSProperties; // Use transient prop with $ prefix
}

const Box = styled.div.attrs<BoxProps>((props) => ({
  style: props.$css, // Map transient prop to style
}))<BoxProps>`
  box-sizing: border-box;
`;

export default Box;

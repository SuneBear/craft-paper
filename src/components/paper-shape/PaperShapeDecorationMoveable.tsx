import React from 'react';
import Moveable from 'react-moveable';
import type { DecorationItem, DecorationTransform } from './decorations';

interface PaperShapeDecorationMoveableProps {
  selectedDecoration: DecorationItem;
  selectedDecorationTarget: SVGGElement;
  svgRef: React.RefObject<SVGSVGElement | null>;
  moveableOriginRef: React.MutableRefObject<DecorationTransform | null>;
  onChange: (id: string, transform: DecorationTransform) => void;
}

export const PaperShapeDecorationMoveable: React.FC<PaperShapeDecorationMoveableProps> = ({
  selectedDecoration,
  selectedDecorationTarget,
  svgRef,
  moveableOriginRef,
  onChange,
}) => {
  return (
    <Moveable
      target={selectedDecorationTarget}
      container={svgRef.current?.parentElement ?? undefined}
      rootContainer={svgRef.current?.parentElement ?? undefined}
      origin={false}
      edge={false}
      draggable={true}
      rotatable={true}
      scalable={true}
      keepRatio={true}
      renderDirections={['nw', 'ne', 'sw', 'se']}
      rotationPosition="top"
      throttleDrag={0}
      throttleRotate={0}
      throttleScale={0}
      onDragStart={() => {
        moveableOriginRef.current = selectedDecoration.transform;
      }}
      onDrag={({ beforeTranslate }) => {
        const origin = moveableOriginRef.current ?? selectedDecoration.transform;
        onChange(selectedDecoration.id, {
          ...origin,
          x: origin.x + beforeTranslate[0],
          y: origin.y + beforeTranslate[1],
        });
      }}
      onDragEnd={() => {
        moveableOriginRef.current = null;
      }}
      onRotateStart={() => {
        moveableOriginRef.current = selectedDecoration.transform;
      }}
      onRotate={({ beforeRotate }) => {
        const origin = moveableOriginRef.current ?? selectedDecoration.transform;
        onChange(selectedDecoration.id, {
          ...origin,
          rotation: origin.rotation + beforeRotate,
        });
      }}
      onRotateEnd={() => {
        moveableOriginRef.current = null;
      }}
      onScaleStart={({ set }) => {
        moveableOriginRef.current = selectedDecoration.transform;
        set([selectedDecoration.transform.scale, selectedDecoration.transform.scale]);
      }}
      onScale={({ scale }) => {
        const origin = moveableOriginRef.current ?? selectedDecoration.transform;
        const nextScale = Math.max(0.3, Math.min(3, scale[0]));
        onChange(selectedDecoration.id, {
          ...origin,
          scale: nextScale,
        });
      }}
      onScaleEnd={() => {
        moveableOriginRef.current = null;
      }}
    />
  );
};

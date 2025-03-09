declare module 'react-force-graph-2d' {
  import { Component } from 'react';

  interface BaseNodeObject {
    id: string;
    [key: string]: any;
  }

  interface BaseLinkObject {
    source: string | BaseNodeObject;
    target: string | BaseNodeObject;
    [key: string]: any;
  }

  interface GraphData<NodeType extends BaseNodeObject = BaseNodeObject, LinkType extends BaseLinkObject = BaseLinkObject> {
    nodes: NodeType[];
    links: LinkType[];
  }

  interface ForceGraph2DProps<NodeType extends BaseNodeObject = BaseNodeObject, LinkType extends BaseLinkObject = BaseLinkObject> {
    graphData: GraphData<NodeType, LinkType>;
    width?: number;
    height?: number;
    backgroundColor?: string;
    nodeLabel?: string | ((node: NodeType) => string);
    nodeVal?: string | ((node: NodeType) => number);
    nodeRelSize?: number;
    nodeColor?: string | ((node: NodeType) => string);
    nodeCanvasObject?: (
      node: NodeType,
      ctx: CanvasRenderingContext2D,
      globalScale: number
    ) => void;
    linkWidth?: number | ((link: LinkType) => number);
    linkColor?: string | ((link: LinkType) => string);
    onNodeClick?: (node: NodeType) => void;
    onLinkClick?: (link: LinkType) => void;
    [key: string]: any;
  }

  export default class ForceGraph2D<
    NodeType extends BaseNodeObject = BaseNodeObject,
    LinkType extends BaseLinkObject = BaseLinkObject
  > extends Component<ForceGraph2DProps<NodeType, LinkType>> {}
}
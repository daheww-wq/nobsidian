// v2 — knowledge graph types
export interface GraphNode {
  id: string;
  label: string;
  path: string;
  tags: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'backlink' | 'tag';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

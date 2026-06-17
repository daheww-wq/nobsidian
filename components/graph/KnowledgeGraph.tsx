'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { useRouter } from 'next/navigation';
import type { GraphData } from '@/types/graph';

interface KnowledgeGraphProps {
  data: GraphData & { tagColorMap: Record<string, string> };
  focusNote?: string;
  filterTag?: string;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  tags: string[];
  connections: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  type: 'backlink' | 'tag';
}

export function KnowledgeGraph({ data, focusNote, filterTag }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();

  const buildViz = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Filter by tag if provided
    let nodes: SimNode[] = data.nodes.map((n) => ({ ...n, connections: 0 }));
    let edges: SimLink[] = data.edges.map((e) => ({ ...e }));
    if (filterTag) {
      const taggedIds = new Set(nodes.filter((n) => n.tags.includes(filterTag)).map((n) => n.id));
      nodes = nodes.filter((n) => taggedIds.has(n.id));
      edges = edges.filter(
        (e) => taggedIds.has(e.source as string) && taggedIds.has(e.target as string)
      );
    }

    // Count connections per node
    const connCount: Record<string, number> = {};
    edges.forEach((e) => {
      const s = typeof e.source === 'string' ? e.source : (e.source as SimNode).id;
      const t = typeof e.target === 'string' ? e.target : (e.target as SimNode).id;
      connCount[s] = (connCount[s] ?? 0) + 1;
      connCount[t] = (connCount[t] ?? 0) + 1;
    });
    nodes = nodes.map((n) => ({ ...n, connections: connCount[n.id] ?? 0 }));

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (e) => {
        g.attr('transform', e.transform.toString());
      });
    svg.call(zoom);

    const g = svg.append('g');

    const sim = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(edges)
          .id((d) => d.id)
          .distance(80)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(30));

    // Links
    const link = g
      .append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', (d) => (d.type === 'tag' ? '#e5e7eb' : '#9ca3af'))
      .attr('stroke-width', (d) => (d.type === 'tag' ? 1 : 1.5))
      .attr('stroke-dasharray', (d) => (d.type === 'tag' ? '4,4' : 'none'))
      .attr('stroke-opacity', 0.6);

    // Nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on('start', (e, d) => {
            if (!e.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (e, d) => {
            d.fx = e.x;
            d.fy = e.y;
          })
          .on('end', (e, d) => {
            if (!e.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as never
      )
      .on('click', (_, d) => router.push(`/workspace/${btoa(d.id)}`));

    node
      .append('circle')
      .attr('r', (d) => Math.max(8, Math.min(20, 8 + d.connections * 2)))
      .attr('fill', (d) => data.tagColorMap[d.tags[0]] ?? '#6b7280')
      .attr('stroke', (d) => (d.id === focusNote ? '#1f2937' : '#fff'))
      .attr('stroke-width', (d) => (d.id === focusNote ? 2.5 : 1.5))
      .attr('fill-opacity', 0.85);

    node
      .append('text')
      .attr('dy', '0.35em')
      .attr('x', (d) => Math.max(8, Math.min(20, 8 + d.connections * 2)) + 6)
      .attr('font-size', '11px')
      .attr('fill', '#374151')
      .text((d) => (d.label.length > 20 ? d.label.slice(0, 18) + '…' : d.label));

    sim.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0);
      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      sim.stop();
    };
  }, [data, focusNote, filterTag, router]);

  useEffect(() => {
    const cleanup = buildViz();
    return cleanup;
  }, [buildViz]);

  return <svg ref={svgRef} className="h-full w-full" />;
}

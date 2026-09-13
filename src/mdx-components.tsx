import type { MDXComponents } from 'mdx/types';
import { CodeBlock } from '@/components/mdx/CodeBlock';
import { DataTable } from '@/components/mdx/DataTable';
import { Compare } from '@/components/mdx/Compare';
import { Term } from '@/components/mdx/Term';
import { Callout, Metrics, Metric, Figure } from '@/components/mdx/Blocks';
import { Sequence } from '@/components/diagram/Sequence';
import { Structure } from '@/components/diagram/Structure';
import { Breakdown } from '@/components/diagram/Breakdown';
import { Playground } from '@/components/diagram/Playground';
import { Series } from '@/components/diagram/Series';
import { Threshold } from '@/components/diagram/Threshold';
import { Transform } from '@/components/diagram/Transform';
import { Spread } from '@/components/diagram/Spread';
import { Legibility } from '@/components/diagram/Legibility';

/**
 * The kit available inside every post. Adding here is how the blog grows new
 * explanatory capability — read AGENTS.md before inventing a one-off.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    pre: CodeBlock,
    table: DataTable,
    // prose furniture
    Compare,
    Term,
    Callout,
    Metrics,
    Metric,
    Figure,
    // explanatory engines
    Sequence,
    Structure,
    Breakdown,
    Playground,
    Series,
    Threshold,
    Transform,
    Spread,
    Legibility,
    ...components,
  };
}

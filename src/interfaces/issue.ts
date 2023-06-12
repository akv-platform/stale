import {IsoDateString} from '../types/iso-date-string';
import {Assignee} from './assignee';
import {ILabel} from './label';
import {IMilestone} from './milestone';
import {components} from '@octokit/openapi-types';
export interface IIssue {
  title: string;
  number: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  labels: ILabel[];
  isPinned: boolean | null;
  pullRequest: boolean | null;
  state: string;
  locked: boolean;
  milestone?: IMilestone | null;
  assignees?: Assignee[] | null;
}

export type OctokitIssue = components['schemas']['issue'];

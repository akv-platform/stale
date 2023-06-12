import {isLabeled} from '../functions/is-labeled';
import {Assignee} from '../interfaces/assignee';
import {IIssue} from '../interfaces/issue';
import {IIssuesProcessorOptions} from '../interfaces/issues-processor-options';
import {ILabel} from '../interfaces/label';
import {IMilestone} from '../interfaces/milestone';
import {IsoDateString} from '../types/iso-date-string';
import {Operations} from './operations';

export class Issue implements IIssue {
  readonly title: string;
  readonly number: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  readonly labels: ILabel[];
  readonly isPinned: boolean | null;
  readonly pullRequest: boolean | null;
  readonly state: string | 'closed' | 'open';
  readonly locked: boolean;
  readonly milestone?: IMilestone | null;
  readonly assignees: Assignee[];
  isStale: boolean;
  markedStaleThisRun: boolean;
  operations = new Operations();
  private readonly _options: IIssuesProcessorOptions;

  constructor(
    options: Readonly<IIssuesProcessorOptions>,
    issue: Readonly<IIssue>
  ) {
    this._options = options;
    this.title = issue.title;
    this.number = issue.number;
    this.createdAt = issue.createdAt;
    this.updatedAt = issue.updatedAt;
    this.labels = 'nodes' in issue.labels ?  mapLabels(issue.labels.nodes as string[]) : mapLabels(issue.labels);
    this.isPinned = 'isPinned' in issue ? issue.isPinned : null;
    this.pullRequest = 'isPinned' in issue ? false : true;
    this.state = issue.state;
    this.locked = issue.locked;
    this.milestone = issue.milestone;
    this.assignees = issue.assignees || [];
    this.isStale = isLabeled(this, this.staleLabel);
    this.markedStaleThisRun = false;
  }

  get isPullRequest(): boolean {
    return !!this.pullRequest;
  }

  get staleLabel(): string {
    return this._getStaleLabel();
  }

  get hasAssignees(): boolean {
    return this.assignees.length > 0;
  }

  private _getStaleLabel(): string {
    return this.isPullRequest
      ? this._options.stalePrLabel
      : this._options.staleIssueLabel;
  }
}

function mapLabels(labels: (string | ILabel)[] | ILabel[]): ILabel[] {
  return labels.map(label => {
    if (typeof label == 'string') {
      return {
        name: label
      };
    }
    return label;
  });
}

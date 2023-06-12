import {IIssue} from './issue';

interface pageInfo {
  endCursor: string;
  hasNextPage: boolean;
}

export interface IGraphQlResponse {
  repository: {
    issues: {
      nodes: IIssue[];
      pageInfo: pageInfo;
    };
    pullRequests: {
      nodes: IIssue[];
      pageInfo: pageInfo;
    }
  };
}

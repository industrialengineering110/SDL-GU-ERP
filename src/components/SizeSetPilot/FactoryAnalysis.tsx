import React from 'react';
import { StageProps, EmptyState, RequestTable } from './shared';

const Component: React.FC<StageProps> = ({ requests }) => {
  const titleMap: Record<string, string> = {
    CuttingConcern: 'Cutting Concern',
    SewingConcern: 'Sewing Concern',
    QualityTeam: 'Quality Team',
    WashConcern: 'Wash Concern',
    FinalInspection: 'Final Inspection',
    FullReport: 'Full Report',
    FactoryAnalysis: 'Factory Analysis',
  };
  const stageMap: Record<string, string | undefined> = {
    CuttingConcern: 'Cutting Concern',
    SewingConcern: 'Sewing / Sample Line Concern',
    QualityTeam: 'Quality Team',
    WashConcern: 'Wash Sample Concern',
    FinalInspection: 'Full Dashboard and Style Report',
    FullReport: undefined,
    FactoryAnalysis: undefined,
  };
  const name = 'FactoryAnalysis';
  return (
    <div className="space-y-6">
      <EmptyState title={titleMap[name]} subtitle={`Overview for ${titleMap[name].toLowerCase()}.`} />
      <RequestTable requests={requests} stageKey={stageMap[name]} />
    </div>
  );
};

export default Component;

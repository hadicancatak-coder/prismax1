import { PageContainer, PageHeader } from "@/components/layout";

const ReportsEmbed = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        description="Embedded Looker Studio reports"
      />
      
      <div className="mt-6 bg-elevated rounded-xl border border-border overflow-hidden">
        <iframe
          width="100%"
          height="800"
          src="https://lookerstudio.google.com/embed/reporting/6bf63f4d-ce3a-4cb1-9dec-5e364cee18a2/page/p_mgemrhyxyd"
          frameBorder="0"
          style={{ border: 0 }}
          allowFullScreen
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </PageContainer>
  );
};

export default ReportsEmbed;

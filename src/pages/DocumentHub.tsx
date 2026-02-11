import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/auth/supabaseAuth";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentStats } from "@/components/documents/DocumentStats";
import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { UrgentDocumentsSection } from "@/components/documents/UrgentDocumentsSection";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { DocumentPreviewDrawer } from "@/components/documents/DocumentPreviewDrawer";
import { DocumentUploadModal } from "@/components/documents/DocumentUploadModal";

interface Document {
  id: string;
  created_at: string;
  file_name: string;
  case_id: string;
  uploaded_by: string;
  document_type: string;
  status: string;
  read_by: string[];
  requires_attention: boolean;
  file_path: string;
  mime_type: string | null;
  category?: string;
  is_sensitive?: boolean;
  note?: string;
}

export default function DocumentHub() {
  const { cases, role } = useApp();
  const { user } = useAuth();
  const isAttorney = role === "ATTORNEY" || role === "SUPER_USER" || role === "SUPER_ADMIN";
  const currentUserId = user?.id || "";
  
  const { documents, loading, markAsRead, refetch } = useDocuments();
  const [selectedCase, setSelectedCase] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showSensitiveOnly, setShowSensitiveOnly] = useState(false);
  const [showAwaitingOnly, setShowAwaitingOnly] = useState(false);
  const [showMyUploadsOnly, setShowMyUploadsOnly] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    if (selectedCase !== "all" && doc.case_id !== selectedCase) return false;
    if (selectedType !== "all" && doc.document_type !== selectedType) return false;
    if (selectedStatus !== "all" && doc.status !== selectedStatus) return false;
    if (selectedCategory !== "all" && doc.category !== selectedCategory) return false;
    if (showSensitiveOnly && !doc.is_sensitive) return false;
    if (showAwaitingOnly && doc.status !== "pending") return false;
    if (showMyUploadsOnly && doc.uploaded_by !== currentUserId) return false;
    
    // Date range filter
    if (dateRange.from || dateRange.to) {
      const docDate = new Date(doc.created_at);
      if (dateRange.from && docDate < dateRange.from) return false;
      if (dateRange.to) {
        const endOfDay = new Date(dateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        if (docDate > endOfDay) return false;
      }
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        doc.file_name.toLowerCase().includes(query) ||
        doc.case_id.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Separate urgent documents that need immediate attention
  const urgentDocuments = filteredDocuments.filter(
    doc => doc.requires_attention && !doc.read_by.includes(currentUserId)
  );
  
  // Regular documents (excluding urgent unread ones)
  const regularDocuments = filteredDocuments.filter(
    doc => !doc.requires_attention || doc.read_by.includes(currentUserId)
  );

  // Sort urgent by date (latest first)
  const sortedUrgent = [...urgentDocuments].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const totalDocuments = documents.length;
  const awaitingReview = documents.filter(d => d.status === "pending").length;
  const sensitiveFiles = documents.filter(d => d.is_sensitive).length;
  const lastUpdated = documents.length > 0 
    ? format(new Date(Math.max(...documents.map(d => new Date(d.created_at).getTime()))), "MMM dd, yyyy")
    : "N/A";

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case "Clinical Report":
        return "bg-[#128f8b]/10 text-[#128f8b] border-[#128f8b]/20";
      case "Legal Filing":
        return "bg-[#0f2a6a]/10 text-[#0f2a6a] border-[#0f2a6a]/20";
      case "Client Form":
        return "bg-[#b09837]/10 text-[#b09837] border-[#b09837]/20";
      case "Provider Note":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 flex items-center justify-center">
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Build Stamp - Temporary Diagnostic Marker */}
      <div
        style={{
          position: 'fixed',
          top: '8px',
          right: '8px',
          fontSize: '12px',
          color: '#6b7280',
          zIndex: 99999,
          fontFamily: 'monospace',
        }}
      >
        BUILD_STAMP: DOCUMENT_HUB_DEBUG_2026_01_17
      </div>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-[#b09837]" />
            Documents & Files
          </h1>
          <p className="text-muted-foreground mt-2">
            Access and manage reports, case files, and uploaded documents in one secure location.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-6">
          <DocumentStats
            totalDocuments={totalDocuments}
            awaitingReview={awaitingReview}
            sensitiveFiles={sensitiveFiles}
            lastUpdated={lastUpdated}
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <DocumentFilters
            selectedCase={selectedCase}
            selectedType={selectedType}
            selectedStatus={selectedStatus}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            dateRange={dateRange}
            showSensitiveOnly={showSensitiveOnly}
            showAwaitingOnly={showAwaitingOnly}
            showMyUploadsOnly={showMyUploadsOnly}
            cases={cases}
            onCaseChange={setSelectedCase}
            onTypeChange={setSelectedType}
            onStatusChange={setSelectedStatus}
            onCategoryChange={setSelectedCategory}
            onSearchChange={setSearchQuery}
            onDateRangeChange={setDateRange}
            onSensitiveOnlyChange={setShowSensitiveOnly}
            onAwaitingOnlyChange={setShowAwaitingOnly}
            onMyUploadsOnlyChange={setShowMyUploadsOnly}
            onUploadClick={() => setShowUploadModal(true)}
            hideUploadUI={isAttorney}
          />
        </div>

        {/* Urgent Documents */}
        {sortedUrgent.length > 0 && (
          <div className="mb-6">
            <UrgentDocumentsSection
              documents={sortedUrgent}
              onMarkAsRead={markAsRead}
              getDocumentTypeColor={getDocumentTypeColor}
            />
          </div>
        )}

        {/* Documents Table */}
        <DocumentTable
          documents={regularDocuments}
          currentUserId={currentUserId}
          onMarkAsRead={markAsRead}
          onPreview={(doc) => setSelectedDoc(doc)}
          getDocumentTypeColor={getDocumentTypeColor}
          cases={cases}
          onUpdate={refetch}
          isAttorney={isAttorney}
        />
      </div>

      {/* Document Preview Panel */}
      <DocumentPreviewDrawer
        document={selectedDoc}
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onUpdate={refetch}
      />
      
      {!isAttorney && (
        <DocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          cases={cases}
          onUploadComplete={refetch}
        />
      )}
    </AppLayout>
  );
}

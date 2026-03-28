// CreatePost v4 - Multi-step generation wizard
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { ArticlePreviewModal } from "@/components/ArticlePreviewModal";
import { AIInstructionsModal } from "@/components/AIInstructionsModal";
import { AuthorSelectModal } from "@/components/AuthorSelectModal";
import { ArticleGenerationWizard } from "@/components/ArticleGenerationWizard";
import { useCreatePost, sectionsToContent } from "@/hooks/useCreatePost";
import { useArticleGeneration } from "@/hooks/useArticleGeneration";
import {
  PostFormFields,
  GuideOptions,
  SEOFields,
  AuthorSection,
  FAQSection,
  ContentFields,
} from "@/components/CreatePost";

const CreatePost = () => {
  const navigate = useNavigate();
  const {
    user, authLoading, loading, loadingPost, contentType, editId,
    categories, tags, formData, setFormData, availableAuthors,
    setAvailableAuthors, userProfile, defaultAiInstructions,
    currentAiInstructions, setCurrentAiInstructions,
    handleTitleChange, handleSubmit,
  } = useCreatePost();

  const {
    wizardOpen, setWizardOpen, openWizard,
    loadingAngles, angles,
    loadingArticle, generatedArticle,
    handleGenerateAngles, handleSelectAngle, handleSelectArticle,
    generatingArticle,
  } = useArticleGeneration(
    formData, setFormData, contentType,
    currentAiInstructions, user?.id, { categories, tags }
  );

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [aiInstructionsModalOpen, setAiInstructionsModalOpen] = useState(false);
  const [authorModalOpen, setAuthorModalOpen] = useState(false);

  if (authLoading || !user || loadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const contentTypeLabels = {
    actualite: "Actualité",
    guide: "Guide",
    aide: "Aide & Subvention",
    annonce: "Annonce",
  };

  return (
    <>
      <Helmet>
        <title>Créer un {contentTypeLabels[contentType as keyof typeof contentTypeLabels]} | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
            </Button>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {editId ? "Éditer" : "Créer"} un{" "}
                  {contentTypeLabels[contentType as keyof typeof contentTypeLabels]}
                </CardTitle>
                <Button type="button" variant="outline" size="sm"
                  onClick={() => setPreviewModalOpen(true)}
                  disabled={!formData.title || !formData.content} className="gap-2">
                  Prévisualisation live
                </Button>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <PostFormFields formData={formData} setFormData={setFormData}
                    categories={categories} tags={tags} onTitleChange={handleTitleChange} />

                  {contentType === "guide" && (
                    <GuideOptions formData={formData} setFormData={setFormData} />
                  )}

                  <ContentFields formData={formData} setFormData={setFormData} contentType={contentType} />
                  <FAQSection formData={formData} setFormData={setFormData} />

                  <SEOFields formData={formData} setFormData={setFormData}
                    onGenerateArticle={openWizard}
                    onOpenAiInstructions={() => setAiInstructionsModalOpen(true)}
                    generatingArticle={generatingArticle}
                    contentType={contentType} />

                  {contentType === "actualite" && (
                    <AuthorSection formData={formData} setFormData={setFormData}
                      userProfile={userProfile} availableAuthors={availableAuthors}
                      setAvailableAuthors={setAvailableAuthors}
                      onOpenAuthorModal={() => setAuthorModalOpen(true)} />
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={(e) => handleSubmit(e, "draft")} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer brouillon"}
                    </Button>
                    <Button type="button" onClick={(e) => handleSubmit(e, "published")} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publier"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />

        <ArticleGenerationWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          contentType={contentType}
          onGenerateAngles={handleGenerateAngles}
          loadingAngles={loadingAngles}
          angles={angles}
          onSelectAngle={handleSelectAngle}
          loadingArticle={loadingArticle}
          generatedArticle={generatedArticle}
          onSelectArticle={handleSelectArticle}
          initialKeywords={formData.focus_keywords}
          initialRegions={formData.target_regions}
        />
          loadingArticle={loadingArticle}
          generatedArticle={generatedArticle}
          onSelectArticle={handleSelectArticle}
          initialKeywords={formData.focus_keywords}
        />

        <ArticlePreviewModal
          open={previewModalOpen} onOpenChange={setPreviewModalOpen}
          title={formData.title}
          content={contentType === "guide" ? sectionsToContent(formData.guide_sections) : formData.content}
          featuredImage={formData.featured_image} excerpt={formData.excerpt}
          focusKeywords={formData.focus_keywords} metaTitle={formData.meta_title}
          metaDescription={formData.meta_description} contentType={contentType}
          guideTemplate={formData.guide_template || undefined}
          tldr={formData.tldr} faq={formData.faq}
          categoryName={categories.find((c) => c.id === formData.category_id)?.name}
        />

        <AIInstructionsModal open={aiInstructionsModalOpen} onOpenChange={setAiInstructionsModalOpen}
          defaultInstructions={defaultAiInstructions} currentInstructions={currentAiInstructions}
          onSave={(instructions) => setCurrentAiInstructions(instructions)} />

        <AuthorSelectModal open={authorModalOpen} onOpenChange={setAuthorModalOpen}
          onAuthorCreated={(author) => {
            setAvailableAuthors((prev) => [...prev, author]);
            setFormData({ ...formData, display_author_id: author.id });
          }} />
      </div>
    </>
  );
};

export default CreatePost;

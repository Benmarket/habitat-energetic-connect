// Helper partagé pour charger la galerie d'images d'un work_type
// depuis la table `email_template_gallery`.
//
// Utilisé par :
//   - admin-preview-emails (rendu de l'aperçu admin)
//   - send-transactional-email (rendu du vrai email envoyé au lead)
//
// Renvoie toujours un tableau (vide si aucune ligne ou erreur),
// le template gère le fallback sur les images par défaut.

export interface GalleryImage {
  src: string
  alt: string
}

export async function loadGalleryForWorkType(
  supabase: any,
  workType: string | undefined | null
): Promise<GalleryImage[]> {
  if (!workType) return []

  const { data, error } = await supabase
    .from('email_template_gallery')
    .select('image_1_url, image_1_alt, image_2_url, image_2_alt, image_3_url, image_3_alt')
    .eq('work_type', workType)
    .maybeSingle()

  if (error || !data) return []

  const slots: GalleryImage[] = []
  for (let i = 1; i <= 3; i++) {
    const src = data[`image_${i}_url`] as string | null
    const alt = data[`image_${i}_alt`] as string | null
    if (src && src.trim().length > 0) {
      slots.push({ src, alt: alt || '' })
    }
  }
  return slots
}

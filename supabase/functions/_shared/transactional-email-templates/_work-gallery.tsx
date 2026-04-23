/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Img, Text } from 'npm:@react-email/components@0.0.22'
import {
  detectWorkType,
  getGalleryImages,
  gallerySection,
  galleryTitle,
  galleryImage,
  galleryCell,
  type WorkType,
} from './_email-design.ts'

export interface CustomGalleryImage {
  src: string
  alt: string
}

interface Props {
  // libellé libre du formulaire ou résumé de la demande,
  // utilisé pour deviner le type de travaux (fallback uniquement).
  hint?: string
  // Permet de forcer un type sans détection automatique.
  workType?: WorkType
  // Images personnalisées passées explicitement (issues de la BDD).
  // Si fournies, elles ont priorité sur les images par défaut.
  images?: CustomGalleryImage[]
  title?: string
}

/**
 * Galerie d'images thématique selon le produit demandé.
 * Rendu en table HTML 3 colonnes pour compatibilité email maximale.
 *
 * Priorité :
 *   1. `images` explicites (depuis la BDD `email_template_gallery`)
 *   2. Sinon, défaut selon `workType`
 *   3. Sinon, détection à partir de `hint`
 *
 * Si aucune image n'est résolue → rendu null (sobre, sans galerie).
 */
export const WorkGallery: React.FC<Props> = ({ hint, workType, images, title }) => {
  const detected = workType ?? detectWorkType(hint)

  // Filtrer les images vides (slots non remplis dans la BDD)
  const customImages = (images ?? []).filter(
    (img) => img && typeof img.src === 'string' && img.src.trim().length > 0
  )

  const resolvedImages =
    customImages.length > 0 ? customImages : getGalleryImages(detected)

  if (resolvedImages.length === 0) return null

  const resolvedTitle =
    title ??
    (detected === 'mix'
      ? 'Aperçu de nos solutions'
      : 'Aperçu de votre projet')

  return (
    <tr>
      <td style={gallerySection}>
        <Text style={galleryTitle}>{resolvedTitle}</Text>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          style={{ borderCollapse: 'separate', borderSpacing: 0 }}
        >
          <tbody>
            <tr>
              {resolvedImages.slice(0, 3).map((img, i) => (
                <td key={i} style={galleryCell} align="center">
                  <Img
                    src={img.src}
                    alt={img.alt}
                    width={180}
                    height={135}
                    style={galleryImage}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  )
}

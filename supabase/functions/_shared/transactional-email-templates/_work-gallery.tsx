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
} from './_email-design.ts'

interface Props {
  // libellé libre du formulaire ou résumé de la demande,
  // utilisé pour deviner le type de travaux.
  hint?: string
  // Permet de forcer un type sans détection automatique.
  workType?: ReturnType<typeof detectWorkType>
  title?: string
}

/**
 * Galerie d'images thématique selon le produit demandé.
 * Rendu en table HTML 3 colonnes pour compatibilité email maximale.
 *
 * Si aucun type n'est détecté → renvoie null (rendu sobre, sans galerie).
 */
export const WorkGallery: React.FC<Props> = ({ hint, workType, title }) => {
  const detected = workType ?? detectWorkType(hint)
  const images = getGalleryImages(detected)

  if (images.length === 0) return null

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
              {images.slice(0, 3).map((img, i) => (
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

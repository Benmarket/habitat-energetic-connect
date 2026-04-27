/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

/**
 * Logo textuel Prime Énergies pour les emails.
 *
 * Reproduit fidèlement le logo du header du site :
 *   « Prime energies » (Prime en vert, energies en blanc)
 *   prime-energies.fr
 *
 * Rendu en HTML pur (pas d'image) → toujours net, jamais cassé,
 * compatible avec tous les clients email.
 *
 * Conçu pour être placé sur fond sombre (header email).
 */
export const EmailBrandLogo: React.FC = () => (
  <table
    role="presentation"
    cellPadding={0}
    cellSpacing={0}
    border={0}
    align="center"
    style={{
      borderCollapse: 'collapse',
      margin: '0 auto',
    }}
  >
    <tbody>
      <tr>
        <td align="center" style={{ padding: 0 }}>
          <div
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              fontSize: '32px',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.5px',
              textAlign: 'center' as const,
            }}
          >
            <span style={{ color: '#3ecf6e' }}>Prime</span>
            <span style={{ color: '#ffffff' }}> energies</span>
          </div>
          <div
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              fontSize: '12px',
              lineHeight: 1.4,
              color: '#ffffff',
              marginTop: '4px',
              textAlign: 'center' as const,
              letterSpacing: '0.2px',
            }}
          >
            <a
              href="https://prime-energies.fr"
              style={{
                color: '#ffffff',
                textDecoration: 'none',
              }}
            >
              https://prime-energies.fr
            </a>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
)

/** Only request headers supply visit metadata; never trust IP/device values in the JSON body. */
export function simulationVisit(headers: Headers) {
  const userAgent = headers.get('user-agent')?.slice(0, 1024) || null;
  const ua = userAgent ?? '';
  const tablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const deviceType = !ua ? null : tablet ? 'Tablette' : /Mobile|iPhone|iPod|Android/i.test(ua) ? 'Mobile' : 'Ordinateur';
  const browsers: [RegExp, string][] = [
    [/(?:Edg|EdgA|EdgiOS)\/([\d.]+)/, 'Microsoft Edge'],
    [/(?:OPR|OPiOS)\/([\d.]+)/, 'Opera'],
    [/SamsungBrowser\/([\d.]+)/, 'Samsung Internet'],
    [/(?:Firefox|FxiOS)\/([\d.]+)/, 'Firefox'],
    [/(?:Chrome|CriOS)\/([\d.]+)/, 'Chrome'],
    [/Version\/([\d.]+).*Safari\//, 'Safari'],
  ];
  let browser: string | null = null;
  for (const [pattern, name] of browsers) {
    const match = ua.match(pattern);
    if (match) { browser = `${name} ${match[1]}`; break; }
  }
  const ip = headers.get('cf-connecting-ip')?.trim() || headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
  return { ip_address: ip === 'unknown' ? null : ip?.slice(0, 64) ?? null, user_agent: userAgent, device_type: deviceType, browser };
}
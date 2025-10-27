import { NextResponse } from 'next/server';

export function middleware(req) {
  const url = req.nextUrl.clone();
  // Remove parâmetro de preview do IDE que causa 404 intermitente
  if (url.searchParams.has('ide_webview_request_time')) {
    url.searchParams.delete('ide_webview_request_time');
    // Reescreve a mesma rota sem o parâmetro
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
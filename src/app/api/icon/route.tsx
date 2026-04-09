import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sizeParam = searchParams.get('size');
  const size = sizeParam ? parseInt(sizeParam) : 192;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#9586E0',
          borderRadius: size * 0.2 + 'px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            width: '60%',
            height: '60%',
            fontSize: size * 0.25 + 'px',
            fontWeight: 'bold',
            color: '#9586E0',
            fontFamily: 'sans-serif',
          }}
        >
          CM
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  );
}

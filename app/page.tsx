'use client';
import React, { useState } from 'react';
const P = [
  {
    id: 1,
    u: 'AlexMoto',
    av: 'AM',
    loc: 'Carpathians',
    l: 234,
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    t: '80km of pure adrenaline!',
    time: '2h',
  },
  {
    id: 2,
    u: 'MariaRider',
    av: 'MR',
    loc: 'Morocco',
    l: 189,
    img: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800',
    t: 'Epic desert trails!',
    time: '5h',
  },
  {
    id: 3,
    u: 'DirtKingUA',
    av: 'DK',
    loc: 'Transcarpathia',
    l: 312,
    img: 'https://images.unsplash.com/photo-1504432842672-1a79f78e4084?w=800',
    t: 'Perfect conditions after rain!',
    time: '1d',
  },
  {
    id: 4,
    u: 'MountainGoat',
    av: 'MG',
    loc: 'Pyrenees',
    l: 445,
    img: 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=800',
    t: '3 days, 250km. Who is in?',
    time: '2d',
  },
];
const R = [
  {
    id: 1,
    n: 'Carpathian Ridge',
    km: 85,
    el: 2400,
    d: 'Hard',
    reg: 'Ukraine',
    gm: 'Carpathian+Mountains+Ukraine',
  },
  {
    id: 2,
    n: 'Atlas Explorer',
    km: 120,
    el: 3100,
    d: 'Expert',
    reg: 'Morocco',
    gm: 'Atlas+Mountains+Morocco',
  },
  {
    id: 3,
    n: 'Pyrenees Trail',
    km: 95,
    el: 2800,
    d: 'Hard',
    reg: 'Spain',
    gm: 'Pyrenees+Spain',
  },
  {
    id: 4,
    n: 'Alps Classic',
    km: 60,
    el: 1900,
    d: 'Medium',
    reg: 'Austria',
    gm: 'Austrian+Alps',
  },
];
const T = [
  {
    id: 1,
    n: 'Carpathian Spring Enduro',
    d: 'May 15-18',
    loc: 'Ukraine',
    s: 8,
    tot: 20,
    p: '290EUR',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
  },
  {
    id: 2,
    n: 'Morocco Desert Challenge',
    d: 'Oct 3-10',
    loc: 'Morocco',
    s: 3,
    tot: 12,
    p: '890EUR',
    img: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600',
  },
  {
    id: 3,
    n: 'Alpine Enduro Tour',
    d: 'Jul 20-25',
    loc: 'Austria',
    s: 12,
    tot: 15,
    p: '650EUR',
    img: 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=600',
  },
];
export default function App() {
  const [tab, setTab] = useState('feed');
  const [lk, setLk] = useState({});
  const [sel, setSel] = useState(1);
  const [lb, setLb] = useState(null);
  const like = function (id) {
    setLk(function (p) {
      var n = Object.assign({}, p);
      n[id] = !n[id];
      return n;
    });
  };
  var rt = R[0];
  for (var i = 0; i < R.length; i++) {
    if (R[i].id === sel) {
      rt = R[i];
      break;
    }
  }
  var mu = 'https://maps.google.com/maps?q=' + rt.gm + '&t=k&z=9&output=embed';
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#fff',
        fontFamily: 'sans-serif',
        maxWidth: '480px',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {lb && (
        <div
          onClick={function () {
            setLb(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={lb}
            style={{ maxWidth: '95vw', maxHeight: '95vh', borderRadius: '8px' }}
            alt=""
          />
        </div>
      )}
      <div
        style={{
          background: '#111',
          padding: '16px',
          textAlign: 'center',
          borderBottom: '1px solid #222',
        }}
      >
        <div style={{ fontSize: '22px', fontWeight: '900', color: '#ff4500' }}>
          ENDURO WORLD
        </div>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
          Global Enduro Community
        </div>
      </div>
      <div style={{ paddingBottom: '70px' }}>
        {tab === 'feed' && (
          <div>
            {P.map(function (p) {
              return (
                <div
                  key={p.id}
                  style={{ background: '#111', marginBottom: '8px' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#ff4500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '13px',
                      }}
                    >
                      {p.av}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600' }}>{p.u}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {p.loc} {p.time}
                      </div>
                    </div>
                  </div>
                  <img
                    onClick={function () {
                      setLb(p.img);
                    }}
                    src={p.img}
                    alt=""
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      display: 'block',
                    }}
                  />
                  <div style={{ padding: '12px 16px' }}>
                    <div
                      style={{
                        marginBottom: '8px',
                        color: '#ddd',
                        fontSize: '14px',
                      }}
                    >
                      {p.t}
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <button
                        onClick={function () {
                          like(p.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: lk[p.id] ? '#ff4500' : '#888',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        {lk[p.id] ? 'LIKED' : 'LIKE'} {p.l + (lk[p.id] ? 1 : 0)}
                      </button>
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#888',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        COMMENT
                      </button>
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#888',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        SHARE
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab === 'map' && (
          <div style={{ padding: '16px' }}>
            <div
              style={{
                marginBottom: '12px',
                fontWeight: '700',
                fontSize: '18px',
              }}
            >
              Routes Map
            </div>
            <div
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '16px',
                border: '1px solid #333',
              }}
            >
              <iframe
                title="map"
                width="100%"
                height="280"
                frameBorder="0"
                style={{ display: 'block' }}
                src={mu}
                allowFullScreen
              />
            </div>
            {R.map(function (r) {
              return (
                <div
                  key={r.id}
                  onClick={function () {
                    setSel(r.id);
                  }}
                  style={{
                    background: sel === r.id ? '#1a1a1a' : '#111',
                    border:
                      sel === r.id ? '1px solid #ff4500' : '1px solid #222',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontWeight: '600' }}>{r.n}</div>
                    <span
                      style={{
                        background:
                          r.d === 'Expert'
                            ? '#c00'
                            : r.d === 'Hard'
                            ? '#f60'
                            : '#060',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '12px',
                      }}
                    >
                      {r.d}
                    </span>
                  </div>
                  <div
                    style={{
                      color: '#888',
                      fontSize: '13px',
                      marginTop: '4px',
                    }}
                  >
                    {r.reg} {r.km}km up{r.el}m
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab === 'tours' && (
          <div style={{ padding: '16px' }}>
            <div
              style={{
                marginBottom: '12px',
                fontWeight: '700',
                fontSize: '18px',
              }}
            >
              Enduro Tours
            </div>
            {T.map(function (t) {
              return (
                <div
                  key={t.id}
                  style={{
                    background: '#111',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    border: '1px solid #222',
                  }}
                >
                  <img
                    src={t.img}
                    alt={t.n}
                    style={{
                      width: '100%',
                      height: '180px',
                      objectFit: 'cover',
                    }}
                  />
                  <div style={{ padding: '14px' }}>
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: '16px',
                        marginBottom: '6px',
                      }}
                    >
                      {t.n}
                    </div>
                    <div
                      style={{
                        color: '#888',
                        fontSize: '13px',
                        marginBottom: '10px',
                      }}
                    >
                      {t.d} {t.loc}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                      }}
                    >
                      <div
                        style={{
                          color: '#ff4500',
                          fontWeight: '700',
                          fontSize: '18px',
                        }}
                      >
                        {t.p}
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: t.s <= 3 ? '#f60' : '#888',
                        }}
                      >
                        {t.s}/{t.tot} spots
                      </div>
                    </div>
                    <button
                      style={{
                        width: '100%',
                        background: '#ff4500',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '15px',
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab === 'profile' && (
          <div style={{ padding: '16px' }}>
            <div
              style={{
                textAlign: 'center',
                padding: '24px 0',
                borderBottom: '1px solid #222',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#ff4500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  margin: '0 auto 12px',
                }}
              >
                AE
              </div>
              <div style={{ fontWeight: '700', fontSize: '20px' }}>
                AlexEnduro
              </div>
              <div style={{ color: '#888', marginTop: '4px' }}>
                Ukraine - Rider since 2018
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '32px',
                  marginTop: '16px',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: '700', fontSize: '18px' }}>48</div>
                  <div style={{ color: '#888', fontSize: '12px' }}>Routes</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: '700', fontSize: '18px' }}>
                    1.2k
                  </div>
                  <div style={{ color: '#888', fontSize: '12px' }}>
                    Followers
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: '700', fontSize: '18px' }}>
                    12.4k km
                  </div>
                  <div style={{ color: '#888', fontSize: '12px' }}>Ridden</div>
                </div>
              </div>
            </div>
            <div
              style={{
                background: '#111',
                borderRadius: '10px',
                padding: '14px',
                border: '1px solid #222',
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '10px' }}>
                My Bikes
              </div>
              <div style={{ color: '#888', fontSize: '14px' }}>
                KTM 300 EXC TPI 2022
              </div>
              <div
                style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}
              >
                Husqvarna TE 250 2020
              </div>
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          background: '#111',
          borderTop: '1px solid #222',
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '480px',
          zIndex: 100,
        }}
      >
        {[
          ['feed', 'Feed'],
          ['map', 'Map'],
          ['tours', 'Tours'],
          ['profile', 'Me'],
        ].map(function (item) {
          return (
            <button
              key={item[0]}
              onClick={function () {
                setTab(item[0]);
              }}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                color: tab === item[0] ? '#ff4500' : '#666',
                padding: '12px 0',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: tab === item[0] ? '700' : '400',
              }}
            >
              {item[1]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

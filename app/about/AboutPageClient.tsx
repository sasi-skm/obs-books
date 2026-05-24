'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLang } from '@/components/layout/LanguageContext'

export default function AboutPageClient() {
  const { t } = useLang()

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingTop: '112px' }}>

      {/* ── HEADER ── */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 32px 48px', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: '10.5px', letterSpacing: '0.22em',
          textTransform: 'uppercase', color: 'rgba(44,36,24,0.45)', marginBottom: '18px',
        }}>
          — {t('aboutPageEyebrow')} —
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 500,
          fontSize: 'clamp(28px, 4.5vw, 54px)', lineHeight: 1.1,
          color: 'var(--brown-dark)', margin: '0 0 20px 0',
        }}>
          {t('aboutHeadlineMain')}{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--moss)' }}>{t('aboutHeadlineAccent')}</em>
        </h1>
        <p style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: '15px', lineHeight: 1.65, color: 'rgba(44,36,24,0.62)', margin: 0,
        }}>
          {t('aboutPageSubtitle')}
        </p>
      </div>

      {/* ── FULL-WIDTH PHOTO ── */}
      <div style={{ textAlign: 'center', padding: '0 32px', marginBottom: '64px' }}>
        <div style={{ display: 'inline-block', maxWidth: '620px', width: '100%' }}>
          <Image
            src="/images/about-our-story.jpg"
            alt="The Alpine Flowers of Britain and Europe — the book that started OBS Books"
            width={900}
            height={1200}
            priority
            sizes="(max-width: 640px) 100vw, 620px"
            style={{ width: '100%', height: 'auto', borderRadius: '2px', display: 'block' }}
          />
        </div>
      </div>

      {/* ── NARRATIVE ── */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 32px' }}>

        <p style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: '17px', lineHeight: 1.72,
          color: 'rgba(44,36,24,0.75)', marginBottom: '40px',
        }}>
          A few years ago I was scrolling through Instagram late at night, looking at an artist&apos;s page.
          In one of her photos I noticed a book open behind her sketchpad. I scrolled through her
          entire profile until I found the title.
        </p>

        <h2 style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500,
          fontSize: '22px', color: 'var(--brown-dark)', margin: '0 0 16px 0',
        }}>
          {t('aboutSection1Heading')}
        </h2>

        <p style={{
          fontFamily: 'var(--font-display)', fontSize: '15px',
          lineHeight: 1.75, color: 'rgba(44,36,24,0.7)', marginBottom: '16px',
        }}>
          The book was <em>The Alpine Flowers of Britain and Europe.</em> I ordered it that
          week. Both my degrees — bachelor&apos;s and master&apos;s — were in plant science, but nothing in
          my studies looked like the illustrations in that book. The scientific papers had diagrams.
          The textbooks had photographs. Nobody painted them like this — with the precision of
          science but the warmth of someone who clearly loved what they were looking at.
        </p>

        <p style={{
          fontFamily: 'var(--font-display)', fontSize: '15px',
          lineHeight: 1.75, color: 'rgba(44,36,24,0.7)', marginBottom: '48px',
        }}>
          I started searching for more books like it. Field guides, wildflower illustration, botanical
          painting — anything with that same careful, hand-labelled style. I could not find a single
          one in any bookshop in Thailand. Not one. So I started looking further.
        </p>

        <div style={{ textAlign: 'center', marginBottom: '48px', fontFamily: 'var(--font-display)', fontSize: '14px', color: 'rgba(44,36,24,0.3)' }}>
          — ✦ —
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500,
          fontSize: '22px', color: 'var(--brown-dark)', margin: '0 0 16px 0',
        }}>
          {t('aboutSection2Heading')}
        </h2>

        <p style={{
          fontFamily: 'var(--font-display)', fontSize: '15px',
          lineHeight: 1.75, color: 'rgba(44,36,24,0.7)', marginBottom: '0',
        }}>
          It was David Sutton&apos;s <em>The Complete Guide to Wild Flowers.</em> When it arrived,
          I sat with it for the whole afternoon. Page after page of wildflowers I had never seen
          growing in real life but recognised from my studies — annotated, painted, named. I remember
          thinking: this is what I had been looking for my whole life. And then I thought — maybe
          someone else in Thailand is looking for this too.
        </p>

      </div>

      {/* ── PULL QUOTE ── */}
      <div style={{
        maxWidth: '680px', margin: '64px auto',
        padding: '48px 32px',
        borderTop: '1px solid rgba(44,36,24,0.1)',
        borderBottom: '1px solid rgba(44,36,24,0.1)',
        textAlign: 'center',
      }}>
        <blockquote style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(17px, 2vw, 22px)', lineHeight: 1.6,
          color: 'var(--brown-dark)', margin: '0 0 20px 0',
        }}>
          {t('aboutPullQuote')}
        </blockquote>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: '11px',
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'rgba(44,36,24,0.48)',
        }}>
          — Sasi, Founder
        </div>
      </div>

      {/* ── WHAT WE KEEP ── */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 32px 72px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500,
          fontSize: '22px', color: 'var(--brown-dark)', margin: '0 0 20px 0',
        }}>
          {t('aboutShelvesHeading')}
        </h2>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: '15px',
          lineHeight: 1.75, color: 'rgba(44,36,24,0.7)', marginBottom: '16px',
        }}>
          It began with wildflowers and grew into nature, fairy tales, art, sketchbooks, cookbooks.
          But wildflowers were first. Wildflowers are always first.
        </p>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: '15px',
          lineHeight: 1.75, color: 'rgba(44,36,24,0.7)', marginBottom: 0,
        }}>
          We do not stock everything. We stock the kinds of books that started this shop — the ones
          with careful illustrations, slow reading, and pages worth keeping. Most are imported. A few
          are secondhand. Some are the only copy in Thailand. When a copy sells, the next one takes a
          week or two to arrive.
        </p>
      </div>

      {/* ── THREE RULES ── */}
      <div style={{ background: 'rgba(44,36,24,0.03)', padding: '72px 32px', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: '10.5px',
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'rgba(44,36,24,0.42)', marginBottom: '18px',
        }}>
          — {t('aboutRulesEyebrow')} —
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 500,
          fontSize: 'clamp(26px, 3.5vw, 42px)', lineHeight: 1.1,
          color: 'var(--brown-dark)', margin: '0 0 56px 0',
        }}>
          {t('aboutRulesHeading')}{' '}
          <em style={{ fontStyle: 'italic' }}>{t('aboutRulesAccent')}</em>
        </h2>
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-10"
          style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'left' }}
        >
          {[
            {
              num: 'I.',
              title: t('aboutRule1Title'),
              body: "Nothing goes on a shelf that Sasi hasn't opened. The note that comes with each book is written from the counter, not from a press release.",
            },
            {
              num: 'II.',
              title: t('aboutRule2Title'),
              body: "Tissue, linen string, and a small slip with the book, illustrator and year. We'd rather take a day longer than send a book that arrives badly wrapped.",
            },
            {
              num: 'III.',
              title: t('aboutRule3Title'),
              body: "We say no a lot — to genres, to trends, to titles that don't belong with the rest. It keeps the room quiet.",
            },
          ].map(rule => (
            <div key={rule.num}>
              <div style={{
                fontFamily: 'var(--font-display)', fontStyle: 'italic',
                fontSize: '15px', color: 'rgba(44,36,24,0.38)', marginBottom: '10px',
              }}>
                {rule.num}
              </div>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontWeight: 500,
                fontSize: '17px', lineHeight: 1.3,
                color: 'var(--brown-dark)', margin: '0 0 10px 0',
              }}>
                {rule.title}
              </h3>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: '14px',
                lineHeight: 1.7, color: 'rgba(44,36,24,0.62)', margin: 0,
              }}>
                {rule.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── TWO PROJECTS ── */}
      <div style={{ background: '#2c2416', padding: '72px 32px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: '10.5px',
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'rgba(245,240,230,0.45)', marginBottom: '16px',
          }}>
            — {t('aboutProjectsEyebrow')} —
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 500,
            fontSize: 'clamp(26px, 3.5vw, 44px)', lineHeight: 1.1,
            color: 'var(--cream)', margin: '0 0 48px 0',
          }}>
            {t('aboutProjectsHeading')}{' '}
            <em style={{ fontStyle: 'italic' }}>{t('aboutProjectsAccent')}</em>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ textAlign: 'left' }}>

            <div style={{ border: '1px solid rgba(245,240,230,0.15)', borderRadius: '2px', padding: '32px' }}>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: '10px',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'rgba(245,240,230,0.45)', marginBottom: '12px',
              }}>
                — The Bookshop —
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontStyle: 'italic',
                fontSize: '22px', color: 'var(--cream)', marginBottom: '14px',
              }}>
                OBS Books
              </div>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: '14px',
                lineHeight: 1.7, color: 'rgba(245,240,230,0.7)', marginBottom: '20px',
              }}>
                The shelves, the books we have been collecting since 2023. Field guides, fairy tales,
                sketchbooks, plates — the kind of books you sit with.
              </p>
              <Link href="/shop" style={{
                fontFamily: 'var(--font-body)', fontSize: '11px',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--cream)', textDecoration: 'none',
                borderBottom: '1px solid rgba(245,240,230,0.4)', paddingBottom: '2px',
              }}>
                You are here →
              </Link>
            </div>

            <div style={{ border: '1px solid rgba(245,240,230,0.15)', borderRadius: '2px', padding: '32px' }}>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: '10px',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'rgba(245,240,230,0.45)', marginBottom: '12px',
              }}>
                — The Monthly Letter —
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontStyle: 'italic',
                fontSize: '22px', color: 'var(--cream)', marginBottom: '14px',
              }}>
                The Flower Letter
              </div>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: '14px',
                lineHeight: 1.7, color: 'rgba(245,240,230,0.7)', marginBottom: '20px',
              }}>
                Born out of the shop. A monthly envelope — a painted letter, a real book page, a
                botanical postcard, a stamp, a bookmark, and a card from The Garden of Good Omens.
                Six small pieces, by post.
              </p>
              <a
                href="https://obsflowerletter.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-body)', fontSize: '11px',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--cream)', textDecoration: 'none',
                  borderBottom: '1px solid rgba(245,240,230,0.4)', paddingBottom: '2px',
                }}
              >
                Visit the Letter →
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* ── HELLO I'M SASI ── */}
      <div style={{ background: 'var(--cream)', padding: '80px 32px' }}>
        <div
          className="flex flex-col md:flex-row gap-14 items-start"
          style={{ maxWidth: '900px', margin: '0 auto' }}
        >
          <div
            className="w-full md:w-[400px]"
            style={{
              position: 'relative', height: '340px',
              flexShrink: 0, borderRadius: '2px', overflow: 'hidden',
            }}
          >
            <Image
              src="/images/about-sasi.jpg"
              alt="Sasi's book collection"
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>

          <div style={{ flex: 1, paddingTop: '8px' }}>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: '10.5px',
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'rgba(44,36,24,0.42)', marginBottom: '14px',
            }}>
              — {t('aboutSasiEyebrow')} —
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500,
              fontSize: 'clamp(22px, 3vw, 32px)', lineHeight: 1.2,
              color: 'var(--brown-dark)', margin: '0 0 20px 0',
            }}>
              {t('aboutSasiHeading')}
            </h2>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: '15px',
              lineHeight: 1.72, color: 'rgba(44,36,24,0.7)', marginBottom: '16px',
            }}>
              I&apos;m the founder, buyer, packer, and occasional painter. Both my degrees are in plant science.
            </p>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: '15px',
              lineHeight: 1.72, color: 'rgba(44,36,24,0.7)', marginBottom: '28px',
            }}>
              If you&apos;re looking for a particular book — or a kind of book — write to me.
              I keep a small list of titles I&apos;m searching for, and yours can go on it.
            </p>
            <a
              href="mailto:obsbooksstore@gmail.com"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-body)', fontSize: '11px',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--moss)', textDecoration: 'none',
                border: '1px solid var(--moss)', borderRadius: '2px',
                padding: '10px 20px', marginBottom: '24px',
              }}
            >
              {t('aboutSasiCTA')} →
            </a>
            <div style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic',
              fontSize: '16px', color: 'rgba(44,36,24,0.5)',
            }}>
              Sasi 🌸
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

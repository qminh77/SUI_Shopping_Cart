'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import {
  Button,
  Card,
  Text,
  Grid,
  Spacer,
  Tag,
  Page
} from '@geist-ui/core';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ShoppingCart, Shield, Zap, ArrowRight } from '@geist-ui/icons';

export default function Home() {
  const account = useCurrentAccount();

  return (
    <Page dotBackdrop width="100%" padding={0}>
      <Navigation />

      {/* Hero Section */}
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '2rem 1rem'
      }}>

        {/* Background Glow */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(77, 162, 255, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
          zIndex: -1,
          maxWidth: '100%'
        }} />

        <Grid.Container gap={2} justify="center">
          <Grid xs={24} direction="column" alignItems="center">
            <div style={{
              padding: '1px',
              background: 'linear-gradient(90deg, rgba(77, 162, 255, 0), rgba(77, 162, 255, 0.5), rgba(77, 162, 255, 0))',
              marginBottom: '1.5rem',
              display: 'inline-flex',
              animation: 'float 6s ease-in-out infinite'
            }} className="cut-corner">
              <div style={{
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(10px)',
                padding: '8px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid rgba(255,255,255,0.05)'
              }} className="cut-corner">
                <div style={{
                  width: '6px',
                  height: '6px',
                  background: '#4DA2FF',
                  boxShadow: '0 0 10px #4DA2FF',
                  animation: 'pulse-glow 2s infinite'
                }} />
                <span style={{
                  fontWeight: 600,
                  letterSpacing: '2px',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-geist-mono)'
                }}>
                  Powered by <span style={{ color: '#4DA2FF' }}>Sui</span>
                </span>
              </div>
            </div>

            <Text h1 style={{
              fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
              letterSpacing: '-0.05em',
              marginBottom: '1rem',
              lineHeight: 1.1,
              background: 'linear-gradient(135deg, #fff 30%, #4DA2FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}>
              The Future of <br />
              Decentralized Commerce
            </Text>

            <Text p font="1.25rem" style={{ maxWidth: '600px', margin: '0 auto 2.5rem', color: '#888', lineHeight: 1.6, padding: '0 1rem' }}>
              Experience the speed of Sui. Buy and sell verifiable digital assets with instant settlement.
            </Text>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/shop" passHref>
                {/* @ts-ignore */}
                <Button
                  shadow
                  type="secondary"
                  style={{
                    height: '50px',
                    padding: '0 32px',
                    fontSize: '1rem',
                    background: '#fff',
                    color: '#000',
                    border: 'none',
                    borderRadius: 0
                  }}
                  className="cut-corner-bottom-right"
                  iconRight={<ArrowRight />}
                >
                  Explore Market
                </Button>
              </Link>
              {account ? (
                <Link href="/seller" passHref>
                  {/* @ts-ignore */}
                  <Button
                    style={{
                      height: '50px',
                      padding: '0 32px',
                      fontSize: '1rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      borderRadius: 0
                    }}
                    className="cut-corner-bottom-right"
                  >
                    Seller Dashboard
                  </Button>
                </Link>
              ) : null}
            </div>
          </Grid>
        </Grid.Container>
      </div>

      {/* Features Grid */}
      <Page.Content>
        <Grid.Container gap={2} justify="center">
          {[
            { icon: <Shield color="#4DA2FF" />, title: 'Verifiable Ownership', desc: 'Every product is an NFT with cryptographically proven ownership on Sui.' },
            { icon: <Zap color="#4DA2FF" />, title: 'Instant Settlement', desc: 'Sub-second transaction finality with minimal gas fees on Sui network.' },
            { icon: <ShoppingCart color="#4DA2FF" />, title: 'NFT Receipts', desc: 'Immutable proof of purchase stored as NFTs for every transaction.' }
          ].map((feature, i) => (
            <Grid xs={24} md={8} key={i}>
              <div style={{
                width: '100%',
                padding: '2rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden'
              }}
                className="group hover:bg-white/5 hover:scale-105 hover:shadow-[0_0_30px_rgba(77,162,255,0.1)] cut-corner"
              >
                <div style={{ marginBottom: '1rem' }}>
                  {feature.icon}
                </div>
                <Text h4 my={0} style={{ marginBottom: '0.5rem' }}>{feature.title}</Text>
                <Text p small style={{ color: '#888', lineHeight: 1.6 }}>
                  {feature.desc}
                </Text>
              </div>
            </Grid>
          ))}
        </Grid.Container>
      </Page.Content>

      <Footer />
    </Page>
  );
}

import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface MagicLinkEmailProps {
  magicLink: string;
  appName?: string;
  expirationMinutes?: number;
  companyName?: string;
  companyLogo?: string;
}

export function MagicLinkEmail({
  magicLink,
  appName = "Auth SDK",
  expirationMinutes = 15,
  companyName = "Auth SDK",
  companyLogo = "https://www.auth-sdk.dev/logo.png",
}: MagicLinkEmailProps) {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Magic Link - {appName}</title>
      </Head>
      <Preview>Sign in to your account</Preview>
      <Body style={main}>
        <Container style={outerContainer}>
          <Container style={container}>
            {/* Logo/Brand */}
            <Section style={logoSection}>
              <Heading style={logo}>{appName}</Heading>
            </Section>

            {/* Main Heading */}
            <Heading style={h1}>Sign in to your account</Heading>

            {/* Description */}
            <Text style={description}>
              Click the button below to securely sign in. This magic link will
              expire in {expirationMinutes} minutes for your security.
            </Text>

            {/* Magic Link Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={magicLink}>
                Sign In
              </Button>
            </Section>

            {/* Alternative Link */}
            <Section style={dividerSection}>
              <Text style={alternativeText}>Or copy and paste this link:</Text>
              <Section style={linkBox}>
                <Link href={magicLink} style={linkText}>
                  {magicLink}
                </Link>
              </Section>
            </Section>

            {/* Security Notice */}
            <Section style={securitySection}>
              <Text style={securityText}>
                If you didn&apos;t request this email, you can safely ignore it.
              </Text>
            </Section>

            {/* Footer */}
            <Section style={footerSection}>
              <Text style={footer}>
                Powered by{" "}
                <Link href="https://www.auth-sdk.dev/" style={footerLink}>
                  auth sdk @ warpy
                </Link>
              </Text>
            </Section>
          </Container>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  margin: "0",
  padding: "0",
  backgroundColor: "#000000",
  fontFamily: "'Courier New', Courier, monospace",
};

const outerContainer = {
  width: "100%",
  backgroundColor: "#000000",
  padding: "60px 20px",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "0 30px",
  textAlign: "center" as const,
};

const logoSection = {
  marginBottom: "50px",
};

const logo = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0",
  letterSpacing: "-0.5px",
};

const h1 = {
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "600",
  margin: "0 0 20px 0",
  lineHeight: "1.2",
  letterSpacing: "-0.5px",
};

const description = {
  color: "#888888",
  fontSize: "16px",
  margin: "0 0 40px 0",
  lineHeight: "1.6",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const buttonContainer = {
  margin: "40px 0",
};

const button = {
  display: "inline-block",
  backgroundColor: "#ffffff",
  color: "#000000",
  textDecoration: "none",
  padding: "16px 40px",
  borderRadius: "6px",
  fontSize: "15px",
  fontWeight: "600",
  letterSpacing: "0.3px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const dividerSection = {
  marginTop: "50px",
  paddingTop: "30px",
  borderTop: "1px solid #1a1a1a",
};

const alternativeText = {
  color: "#666666",
  fontSize: "13px",
  margin: "0 0 12px 0",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const linkBox = {
  backgroundColor: "#0a0a0a",
  border: "1px solid #1a1a1a",
  borderRadius: "6px",
  padding: "14px",
  wordBreak: "break-all" as const,
};

const linkText = {
  color: "#888888",
  fontSize: "12px",
  textDecoration: "none",
  fontFamily: "'Courier New', Courier, monospace",
};

const securitySection = {
  marginTop: "40px",
};

const securityText = {
  color: "#666666",
  fontSize: "13px",
  margin: "0",
  lineHeight: "1.6",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const footerSection = {
  padding: "50px 30px 30px 30px",
  textAlign: "center" as const,
};

const footer = {
  color: "#666666",
  fontSize: "13px",
  margin: "0",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const footerLink = {
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "500",
};

export default MagicLinkEmail;

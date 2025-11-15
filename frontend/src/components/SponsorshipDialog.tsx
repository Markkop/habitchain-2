import { X } from "lucide-react";

interface SponsorshipDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SponsorshipDialog({
  isOpen,
  onClose,
}: SponsorshipDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="sponsor-modal-overlay"
      onClick={onClose}
    >
      <div
        className="sponsor-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sponsor-modal-header">
          <h3>Sponsor HabitChain</h3>
          <button
            onClick={onClose}
            className="sponsor-modal-close"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="sponsor-modal-content">
          <section className="sponsor-section">
            <h4>What is Sponsorship?</h4>
            <p>
              Sponsors work similar to treasury funded campaigns.
            </p>
            <p>
              Brands can sponsor HabitChain, providing extra rewards to users and having their brand appear in the UI.
            </p>
          </section>

          <section className="sponsor-section">
            <h4>How It Works</h4>
            <ul>
      <li>Using Smart Contracts functions, any user, brand or organization can add funds to a Sponsored Compaign</li>
      <li>Once approved - by the smart contract owner or eventually governance - the campaign goes live</li>
      <li>When receiving rewards, users will see the sponsor's brand and extra reward amount</li>
      <li>This happens on-chain and all data is transparent and verifiable.</li>
      <li>Only verified users are eligible for the sponsored rewards.</li>
      <li>And to prevent abuse, only one reward per day per user is allowed.</li>

            </ul>
          </section>

          <section className="sponsor-section">
            <h4>Current State and Roadmap</h4>
            <ul>
      <li>We need to elaborate the idea and think better on how to implement it</li>
      <li>Main topics to discuss: sponsor approval, frontend update process, user verification and abuse prevention.</li>
      <li>We expect 2-3 weeks of fulltime work to reach a state where campagins can be created and managed</li>
      <li>This feature is not needed for launch, but vital for increasing incentives and engagement</li>


            </ul>
          </section>

          <section className="sponsor-section">
            <h4>Get Involved</h4>
            <p>
              Interested in sponsoring HabitChain? Contact us to discuss how your brand can engage with HabitChain's motivated community of users building better habits.
            </p>
            <p className="sponsor-contact">
              <a
                href="https://github.com/Markkop/habitchain-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </a>
              {" • "}
              <a
                href="https://docs.google.com/document/d/1Eu4Ip90cX1-8Hu67yKhbQASp3VrLHapzO3fRKzjh1sA/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
              >
                Project Hub
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}


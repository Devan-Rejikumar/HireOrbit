import React, { useState } from 'react';
import { SlideModal } from './ui/slide-modal';
import { useConfirmation } from '@/hooks/useConfirmation';
import { Button } from './ui/button';

const TestModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { confirm, ConfirmationDialog } = useConfirmation();

  const handleTestConfirm = async () => {
    const confirmed = await confirm({
      title: 'Test Confirmation',
      message: 'This is a test confirmation dialog. Do you want to proceed?',
      confirmText: 'Yes, Test',
      cancelText: 'No, Cancel'
    });

    if (confirmed) {
      alert('Confirmed!');
    } else {
      alert('Cancelled!');
    }
  };

  return (
    <div className="p-4">
      <Button onClick={() => setIsOpen(true)}>Test Slide Modal</Button>
      <Button onClick={handleTestConfirm} className="ml-4">Test Confirmation</Button>
      
      <SlideModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Test Modal"
      >
        <p>This is a test modal. It slides in from the right side.</p>
        <Button onClick={() => setIsOpen(false)}>Close</Button>
      </SlideModal>

      <ConfirmationDialog />
    </div>
  );
};

export default TestModal;
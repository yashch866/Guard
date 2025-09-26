import { useState } from 'react';
import { Command as CommandPrimitive } from "cmdk";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    question: "How do I start a patrol?",
    answer: "To start a patrol, navigate to the main dashboard and click the 'Start Patrol' button. You can choose between automated or manual patrol modes.",
    category: "Operation",
  },
  {
    question: "How do I use the voice communication feature?",
    answer: "Press and hold the Talk button while speaking. Release to listen. You can adjust volume and microphone settings in the audio settings menu.",
    category: "Operation",
  },
  {
    question: "What should I do if the robot loses connection?",
    answer: "First check your WiFi connection, then try moving closer to the robot. If issues persist, restart both the robot and dashboard application.",
    category: "Technical",
  },
  {
    question: "How often should I charge the robot?",
    answer: "The robot should be charged when battery level falls below 20%. A full charge typically takes 4 hours.",
    category: "Maintenance",
  },
  {
    question: "How do I update the software?",
    answer: "Software updates are automatic. You'll receive a notification when updates are available. Ensure the robot is charging during updates.",
    category: "Technical",
  },
  {
    question: "What is the maximum patrol duration?",
    answer: "Maximum patrol duration depends on battery life, typically 4-6 hours on a full charge under normal conditions.",
    category: "Operation",
  },
  {
    question: "How do I customize patrol routes?",
    answer: "Access Settings > Patrol Configuration to create and modify patrol routes using the map interface.",
    category: "Operation",
  },
  {
    question: "What is the coverage area of the robot?",
    answer: "The robot can effectively patrol an area up to 10,000 square feet, depending on layout and obstacles.",
    category: "Technical",
  },
  {
    question: "How do I clean the robot's sensors?",
    answer: "Use a soft, dry cloth to gently clean sensors. For detailed cleaning instructions, refer to the maintenance guide.",
    category: "Maintenance",
  },
  {
    question: "What should I do in case of emergency?",
    answer: "Press the Emergency Stop button on the dashboard or robot. Contact support if additional assistance is needed.",
    category: "Operation",
  }
];

export function FAQSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredFAQs = faqData.filter((faq) => {
    const searchLower = search.toLowerCase();
    return (
      faq.question.toLowerCase().includes(searchLower) ||
      faq.answer.toLowerCase().includes(searchLower) ||
      faq.category.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Search className="mr-2 h-4 w-4" />
          Search FAQs...
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Search FAQs</DialogTitle>
          <DialogDescription>
            Type your question or keywords to find answers
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-popover shadow-md">
          <div className="overflow-hidden rounded-lg">
            <div className="flex items-center border-b px-3">
              <input
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Type to search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              <ScrollArea className="h-[400px] p-4">
                {filteredFAQs.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    No results found.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredFAQs.map((faq, index) => (
                      <div
                        key={index}
                        className="rounded-lg border p-4 hover:bg-accent hover:text-accent-foreground"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{faq.question}</span>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              {faq.category}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
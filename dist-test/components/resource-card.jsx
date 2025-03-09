"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceCard = void 0;
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const ResourceCard = ({ resource }) => (<card_1.Card className="hover:shadow-md transition-shadow">
    <card_1.CardHeader>
      <card_1.CardTitle className="text-lg">{resource.metadata.title}</card_1.CardTitle>
    </card_1.CardHeader>
    <card_1.CardContent>
      <p className="text-sm text-gray-600 mb-3">{resource.metadata.description}</p>
      <div className="flex flex-wrap gap-2">
        <badge_1.Badge>{resource.category}</badge_1.Badge>
        {resource.metadata.topics.map(topic => (<badge_1.Badge key={topic} variant="outline">{topic}</badge_1.Badge>))}
      </div>
    </card_1.CardContent>
  </card_1.Card>);
exports.ResourceCard = ResourceCard;
//# sourceMappingURL=resource-card.jsx.map